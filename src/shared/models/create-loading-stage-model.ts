import type { Nullable } from 'typescript-extended-types'

import { setSubModel } from '@/shared/helpers/set-sub-model'
import type { FetchStatus } from '@/shared/types/fetch-status'
import type { SubModelCreator } from '@/shared/types/sub-model-creator'

/**
 * Данные стадии загрузки.
 *
 * Единственный источник правды — стор. Новое поле добавляется сюда,
 * оттуда попадает в публичный интерфейс и автоматически сохраняется
 * между пересозданиями объекта стадии.
 */
interface LoadingStageData {
  loadStatus: FetchStatus
  errorMessage: Nullable<string>
}

/**
 * Начальные данные стадии загрузки.
 */
export const INITIAL_DATA: LoadingStageData = {
  loadStatus: 'initial',
  errorMessage: null,
}

/**
 * Публичный интерфейс стадии загрузки.
 *
 * Данные (`loadStatus`, `errorMessage`) — обычные поля. Предикаты — геттеры,
 * читающие стор при каждом обращении.
 */
export interface LoadingStageModel extends Readonly<LoadingStageData> {
  readonly isLoading: boolean
  readonly isSuccess: boolean
  readonly isInitial: boolean
  readonly isError: boolean
  readonly isFinished: boolean
  loading: () => void
  success: () => void
  error: (message?: Nullable<string>) => void
  reset: () => void
}

/**
 * Создаёт вложенную под-модель «стадия загрузки».
 *
 * В отличие от `createLoadingSlice`, который микшируется в стор плоским
 * слоем, вся под-модель лежит в одной ключ-области (`path`) и доступна как
 * `get().reloadingStage.isLoading`.
 *
 * Как это работает:
 * - значение статуса лежит в поле `loadStatus` самого объекта стадии;
 * - предикаты — геттеры, читающие `get()[path].loadStatus` при каждом обращении;
 * - экшены создают новый объект стадии и кладут его в стор по ключу `path`.
 *   Новая ссылка нужна, чтобы zustand увидел изменение и уведомил
 *   подписчиков (`useStore((s) => s.reloadingStage.isLoading)`).
 *
 * @example
 * ```ts
 * interface CommentsStore {
 *   comments: Array<Comment>
 *   reloadingStage: LoadingStageModel
 *   loadingMoreStage: LoadingStageModel
 *   loadMoreComments: () => Promise<Nullable<CommentsResponse>>
 * }
 *
 * export const useCommentsStore = create<CommentsStore>()((set, get) => ({
 *   comments: [],
 *   reloadingStage: createLoadingStageModel(set, get, 'reloadingStage'),
 *   loadingMoreStage: createLoadingStageModel(set, get, 'loadingMoreStage'),
 *
 *   async loadMoreComments() {
 *     if (get().loadingMoreStage.isLoading) return null
 *
 *     get().loadingMoreStage.loading()
 *     const response = await fetchComments()
 *
 *     if (response.isError) get().loadingMoreStage.error()
 *     else get().loadingMoreStage.success()
 *
 *     return response
 *   },
 * }))
 * ```
 */
export const createLoadingStageModel: SubModelCreator<LoadingStageModel> = (
  set,
  get,
  path,
) => {
  const getData = (): LoadingStageData => {
    return get()[path] as LoadingStageData
  }

  const setModel = (data: LoadingStageData) => {
    setSubModel(set, path, makeModel(data))
  }

  const getStatus = (): FetchStatus => {
    return getData().loadStatus
  }

  // Обычная функция-конструктор, а не стрелочная: вызывается из setModel
  // раньше своего объявления (hoisting), поэтому здесь нужен hoisted вид.
  function makeModel(data: LoadingStageData): LoadingStageModel {
    return {
      ...data,

      get isInitial() {
        return getStatus() === 'initial'
      },
      get isLoading() {
        return getStatus() === 'loading'
      },
      get isSuccess() {
        return getStatus() === 'success'
      },
      get isError() {
        return getStatus() === 'error'
      },
      get isFinished() {
        const status = getStatus()

        return status === 'success' || status === 'error'
      },

      loading: () =>
        setModel({
          loadStatus: 'loading',
          errorMessage: null,
        }),

      success: () =>
        setModel({
          loadStatus: 'success',
          errorMessage: null,
        }),

      error: (message) =>
        setModel({
          loadStatus: 'error',
          errorMessage: message ?? null,
        }),

      reset: () => setModel(INITIAL_DATA),
    }
  }

  return makeModel(INITIAL_DATA)
}
