import { type BaseObject, type Nullable } from 'typescript-extended-types'

import { isEmptyQueryValue } from '@/shared/helpers/is-empty-query-value'

/**
 * Читает значение query-параметра из адресной строки.
 *
 * Пустое значение (`?search=`) возвращается как `null`, чтобы вызывающий
 * код различал «параметра нет» и «параметр пустой» одной проверкой.
 */
export function readQueryParam(name: string): Nullable<string> {
  const value = new URLSearchParams(window.location.search).get(name)

  if (isEmptyQueryValue(value)) {
    return null
  }

  return value
}

/**
 * Записывает query-параметры в адресную строку, сохраняя чужие параметры.
 *
 * Пустое значение удаляет параметр — адрес остаётся чистым при
 * сброшенном фильтре.
 *
 * Используется `replaceState`, а не `pushState`: каждое изменение
 * фильтра не должно плодить запись в истории, иначе кнопка «назад»
 * начинает листать состояния поиска вместо перехода между страницами.
 */
export function writeQueryParams(params: BaseObject): void {
  const search = new URLSearchParams(window.location.search)

  for (const [key, value] of Object.entries(params)) {
    if (isEmptyQueryValue(value)) {
      search.delete(key)

      continue
    }

    search.set(key, String(value))
  }

  const queryString = search.toString()
  const path = `${window.location.pathname}${queryString ? `?${queryString}` : ''}`

  window.history.replaceState(
    window.history.state,
    '',
    `${path}${window.location.hash}`,
  )
}
