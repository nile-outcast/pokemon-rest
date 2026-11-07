import queryString, {
  type ParseOptions,
  type StringifyOptions,
} from 'query-string'
import { type BaseObject } from 'typescript-extended-types'
import type { ZodType } from 'zod'

export const QUERY_PARAMS_PARSE_OPTIONS: ParseOptions = {
  parseNumbers: true,
  parseBooleans: true,
  arrayFormat: 'bracket',
}

export const QUERY_PARAMS_STRINGIFY_OPTIONS: StringifyOptions = {
  skipNull: true,
  skipEmptyString: true,
  arrayFormat: 'bracket',
}

/**
 * Читает значение query-параметра из адресной строки
 * и валидирует по переданной схеме
 */
export function readQueryParams<T>(schema: ZodType<T>): Partial<T> {
  const parsed = queryString.parse(
    window.location.search,
    QUERY_PARAMS_PARSE_OPTIONS,
  )

  const result = schema.safeParse(parsed)

  return result.success ? result.data : {}
}

/**
 * Записывает query-параметры в адресную строку
 *
 * Используется `replaceState`, а не `pushState`: каждое изменение
 * фильтра не должно плодить запись в истории, иначе кнопка «назад»
 * начинает листать состояния поиска вместо перехода между страницами.
 */
export function writeQueryParams(params: BaseObject): void {
  const query = queryString.stringify(params, QUERY_PARAMS_STRINGIFY_OPTIONS)
  const path = `${window.location.pathname}${query ? `?${query}` : ''}`

  window.history.replaceState(
    window.history.state,
    '',
    `${path}${window.location.hash}`,
  )
}
