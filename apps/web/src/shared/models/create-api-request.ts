import queryString from 'query-string'
import {
  isDefined,
  isNullish,
  type BaseObject,
  type Nullable,
} from 'typescript-extended-types'

import { POKEMON_API_BASE_URL } from '@/shared/config/pokemon-api'
import type {
  ApiCallArgs,
  ApiCallConfig,
  ApiCallResponse,
} from '@/shared/types/api-call'

interface ApiRequestHandle<D, E extends Error = Error> {
  call: <Body extends BaseObject | FormData = BaseObject>(
    params?: ApiCallArgs<Body>,
  ) => Promise<ApiCallResponse<D, E>>
  cancel: () => void
  isPending: () => boolean
}

function buildUrl(path: string, query?: BaseObject): string {
  if (isNullish(query) || Object.keys(query).length === 0) {
    return path
  }

  const qs = queryString.stringify(query, {
    skipNull: true,
    skipEmptyString: true,
  })

  // Все параметры оказались пустыми — не добавляем голый «?»
  if (!qs) {
    return path
  }

  const separator = path.includes('?') ? '&' : '?'

  return `${path}${separator}${qs}`
}

async function safeParse<T>(response: Response): Promise<Nullable<T>> {
  const contentType = response.headers.get('content-type')

  if (isNullish(contentType) || !contentType.includes('application/json')) {
    return null
  }

  try {
    return await response.json()
  } catch {
    return null
  }
}

function getRequestBody<Body extends BaseObject | FormData>(
  body?: Body,
): Nullable<FormData | string> {
  if (isNullish(body)) {
    return null
  }

  const isFormData = body instanceof FormData

  return isFormData ? body : (JSON.stringify(body) ?? null)
}

const DEFAULT_CONFIG: ApiCallConfig = {
  baseUrl: POKEMON_API_BASE_URL,
}

/**
 * Фабрика для выполнения HTTP-запросов с автоматической обработкой ошибок и отменой.
 *
 * @param initConfig — опциональный метод, заголовки, путь
 * @returns объект с методом call(), cancel() и isPending()
 */
export function createApiRequest<D, E extends Error = Error>(
  initConfig: ApiCallConfig = {},
): ApiRequestHandle<D, E> {
  const config: ApiCallConfig = { ...DEFAULT_CONFIG, ...initConfig }

  let controller: Nullable<AbortController> = null

  return {
    async call(args = {}) {
      const {
        method = 'GET',
        headers = {},
        baseUrl = '',
        path = '',
        query,
        body,
      } = { ...config, ...args }

      controller?.abort()

      const currentController = new AbortController()
      controller = currentController

      try {
        const url = buildUrl(`${baseUrl}${path}`, query)

        const isFormData = body instanceof FormData

        const response = await fetch(url, {
          method,
          headers: {
            ...headers,
            ...(isFormData || isNullish(body)
              ? {}
              : { 'Content-Type': 'application/json' }),
          },
          body: getRequestBody(body),
          signal: currentController.signal,
        })

        if (!response.ok) {
          return {
            isError: true,
            data: await safeParse<E>(response),
          }
        }

        // 204 No Content — тела нет, D для такого запроса должен быть void
        const data = response.status === 204 ? undefined : await response.json()

        return {
          isError: false,
          data: data as D,
        }
      } catch (rawError) {
        if (currentController.signal.aborted) {
          return {
            isCancelled: true,
            isError: true,
            rawError,
          }
        }

        return {
          isError: true,
          rawError,
        }
      } finally {
        if (controller === currentController) {
          controller = null
        }
      }
    },

    cancel: () => controller?.abort(),
    isPending: () => isDefined(controller),
  }
}
