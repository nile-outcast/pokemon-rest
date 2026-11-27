import type { GetState, SetState } from '@/shared/types/zustand-actions'

/**
 * Сигнатура фабрики среза для Zustand-стора.
 *
 * Срез — обычная функция двух аргументов: не получает StoreApi
 * (третий аргумент StateCreator) и типизирован только собственной
 * частью состояния, поэтому не зависит от целевого стора.
 *
 * Использование:
 *   export const createCounterSlice: SliceCreator<CounterSlice> = (set, get) => ({ ... })
 *   // в сторе: ...createCounterSlice(set, get)
 */
export type SliceCreator<Slice, Config = undefined> = (
  set: SetState<Slice>,
  get: GetState<Slice>,
  config?: Config,
) => Slice
