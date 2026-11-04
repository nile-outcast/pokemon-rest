import type { FetchStatus } from '@/shared/types/fetch-status'
import type { SliceCreator } from '@/shared/types/slice-creator'

/**
 * Микшируется в стор плоским слоем через спред:
 * `...createLoadingSlice(set, get)`.
 */
export interface LoadingSlice {
  loadStatus: FetchStatus
  // Экшены по именам статусов
  loading: () => void
  success: () => void
  error: () => void
  reset: () => void
  // Предикаты
  isInitial: () => boolean
  isLoading: () => boolean
  isSuccess: () => boolean
  isError: () => boolean
  isFinished: () => boolean
}

/**
 * Переиспользуемый срез «статус загрузки».
 *
 * Сигнатура — через SliceCreator<LoadingSlice>: обычная функция двух
 * аргументов, без StoreApi. set/get типизированы собственным типом
 * среза — срез не зависит от целевого стора и не может читать чужие
 * поля через get().
 */
export const createLoadingSlice: SliceCreator<LoadingSlice> = (set, get) => ({
  loadStatus: 'initial',

  loading: () => set({ loadStatus: 'loading' }),
  success: () => set({ loadStatus: 'success' }),
  error: () => set({ loadStatus: 'error' }),
  reset: () => set({ loadStatus: 'initial' }),

  isInitial: () => get().loadStatus === 'initial',
  isLoading: () => get().loadStatus === 'loading',
  isSuccess: () => get().loadStatus === 'success',
  isError: () => get().loadStatus === 'error',
  isFinished: () =>
    get().loadStatus === 'success' || get().loadStatus === 'error',
})
