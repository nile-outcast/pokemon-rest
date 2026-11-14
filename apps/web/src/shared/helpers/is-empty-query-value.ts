import { isNullish } from 'typescript-extended-types'

/**
 * Значение query-параметра, которое не нужно отправлять: отсутствует
 * (`null`/`undefined`) или пустое (`''`, `[]`).
 *
 * `String(null)` дал бы в URL «null», пустую строку отклоняют серверные
 * zod-схемы (`min(1)`), а пустой массив — это снятый фильтр. Такие
 * параметры вырезаются и из запроса к API, и из адресной строки.
 */
export function isEmptyQueryValue(value: unknown): boolean {
  if (isNullish(value)) {
    return true
  }

  if (typeof value === 'string') {
    return value === ''
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  return false
}
