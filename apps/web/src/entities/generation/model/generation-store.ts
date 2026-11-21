import type { BaseEntity, GenerationListResponse } from '@pokemon-rest/shared'
import { create } from 'zustand'

import { toErrorMessage } from '@/shared/helpers/to-error-message'
import { createApiRequest } from '@/shared/models/create-api-request'
import {
  createLoadingStageModel,
  type LoadingStageModel,
} from '@/shared/models/create-loading-stage-model'
import {
  createPaginationModel,
  type PaginationModel,
} from '@/shared/models/create-pagination-model'

interface GenerationState {
  items: Array<BaseEntity>
  pagination: PaginationModel
  loadingStage: LoadingStageModel
  loadingMoreStage: LoadingStageModel
  fetchGenerationList: () => Promise<void>
  fetchNextPage: () => Promise<void>
}

const generationListRequest = createApiRequest<GenerationListResponse>({
  path: '/generation',
})

/**
 * Идентификатор последнего запроса списка.
 *
 * Счётчик позволяет устаревшему ответу не перезаписать данные более
 * нового запроса.
 */
let listRequestId = 0

export const useGenerationStore = create<GenerationState>()((set, get) => ({
  items: [],
  loadingStage: createLoadingStageModel(set, get, 'loadingStage'),
  loadingMoreStage: createLoadingStageModel(set, get, 'loadingMoreStage'),

  pagination: createPaginationModel(set, get, 'pagination', { limit: 2 }),

  fetchGenerationList: async () => {
    // Защита от повторного запроса при успехе или загрузке
    if (get().loadingStage.isSuccess || get().loadingStage.isLoading) {
      return
    }

    const requestId = ++listRequestId

    get().pagination.reset()
    get().loadingStage.loading()
    // Новая загрузка списка делает ошибку дозагрузки неактуальной
    get().loadingMoreStage.reset()

    const result = await generationListRequest.call({
      query: {
        limit: get().pagination.limit,
        offset: 0,
      },
    })

    // Ответ устаревшего запроса — состояние принадлежит новому
    if (requestId !== listRequestId) {
      return
    }

    if (result.isError) {
      if (result.isCancelled) {
        get().loadingStage.reset()

        return
      }

      get().loadingStage.error(toErrorMessage(result))

      return
    }

    get().loadingStage.success()
    set({ items: result.data.items })
    // Фиксируем total: от него зависит hasMore для дозагрузки
    get().pagination.setTotal(result.data.total)
  },

  fetchNextPage: async () => {
    // Защита от параллельных запросов и загрузки при отсутствии данных
    if (
      get().loadingStage.isLoading ||
      get().loadingMoreStage.isLoading ||
      !get().pagination.hasMore
    ) {
      return
    }

    get().loadingMoreStage.loading()
    // Оптимистичный переход: offset под-модели — начало текущей страницы,
    // поэтому следующая страница уже сдвинута и запрашивается как текущая
    get().pagination.next()

    const { limit, offset } = get().pagination

    const result = await generationListRequest.call({
      query: {
        limit,
        offset,
      },
    })

    if (result.isError) {
      // Данных с новой страницы нет — возвращаем offset к последней загруженной
      get().pagination.previous()

      if (result.isCancelled) {
        get().loadingMoreStage.reset()

        return
      }

      get().loadingMoreStage.error(toErrorMessage(result))

      return
    }

    get().loadingMoreStage.success()
    set({ items: [...get().items, ...result.data.items] })
    // Фиксируем total: от него зависит hasMore для следующего перехода
    get().pagination.setTotal(result.data.total)
  },
}))
