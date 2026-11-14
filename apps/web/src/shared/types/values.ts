import type { Nullable } from 'typescript-extended-types'

/**
 * Числовой диапазон
 *
 * Не заполненное пользователем поле — `null`, а не `undefined`: пустое
 * поле означает «фильтр не активен», и это состояние различимо одной
 * проверкой `isNullish`.
 */
export interface RangeValue {
  min: Nullable<number>
  max: Nullable<number>
}
