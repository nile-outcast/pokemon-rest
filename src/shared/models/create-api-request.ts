import {
  isNullish,
  type BaseObject,
  type Nullable,
} from 'typescript-extended-types'

import type {
  ApiCallArgs,
  ApiCallConfig,
  ApiCallResponse,
} from '@/shared/types/api-call'

interface ApiRequestHandle<D, E extends Error = Error> {
  call: <Body extends BaseObject | FormData = BaseObject>(
    params: ApiCallArgs<Body>,
  ) => Promise<ApiCallResponse<D, E>>
  cancel: () => void
  isPending: () => boolean
}

function buildUrl(path: string, query?: BaseObject): string {
  if (!query || Object.keys(query).length === 0) {
    return path
  }

  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(query)) {
    params.append(key, String(value))
  }

  const separator = path.includes('?') ? '&' : '?'

  return `${path}${separator}${params.toString()}`
}

async function safeParse<T>(response: Response): Promise<T | undefined> {
  const contentType = response.headers.get('content-type')

  if (!contentType || !contentType.includes('application/json')) {
    return undefined
  }

  try {
    return await response.json()
  } catch {
    return undefined
  }
}

function getRequestBody<Body extends BaseObject | FormData>(
  body?: Body,
): FormData | string | undefined {
  if (isNullish(body)) return

  const isFormData = body instanceof FormData

  return isFormData ? body : JSON.stringify(body)
}

/**
 * Фабрика для выполнения HTTP-запросов с автоматической обработкой ошибок и отменой.
 *
 * @param path — URL или путь (без query-параметров)
 * @param config — опциональный метод, заголовки
 * @returns объект с методом call(), cancel() и isPending()
 */
export function createApiRequest<D, E extends Error = Error>(
  path: string,
  config: ApiCallConfig = {},
): ApiRequestHandle<D, E> {
  const baseUrl = config.baseUrl ?? ''
  let controller: Nullable<AbortController> = null

  return {
    async call({ query, body }) {
      controller?.abort()
      controller = new AbortController()

      try {
        const url = buildUrl(`${baseUrl}${path}`, query)

        const isFormData = body instanceof FormData

        const response = await fetch(url, {
          method: config.method ?? 'GET',
          headers: {
            ...config.headers,
            'Content-Type': isFormData
              ? 'multipart/form-data'
              : 'application/json',
          },
          body: getRequestBody(body),
          signal: controller.signal,
        })

        if (!response.ok) {
          return {
            isError: true,
            data: await safeParse<E>(response),
          }
        }

        return {
          isError: false,
          data: await response.json(),
        }
      } catch (rawError) {
        if (controller?.signal.aborted) {
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
        controller = null
      }
    },

    cancel: () => controller?.abort(),
    isPending: () => !isNullish(controller),
  }
}
