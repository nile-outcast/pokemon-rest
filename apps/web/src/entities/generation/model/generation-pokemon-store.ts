import type {
  GenerationPokemonListResponse,
  PokemonCard,
} from '@pokemon-rest/shared'
import { isDefined } from 'typescript-extended-types'
import { createStore } from 'zustand/vanilla'

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

/**
 * Срез состояния одного поколения покемонов.
 */
interface GenerationPokemonState {
  items: Array<PokemonCard>
  pagination: PaginationModel
  loadingStage: LoadingStageModel
  loadingMoreStage: LoadingStageModel
  fetchGenerationPokemonList: () => Promise<void>
  fetchGenerationPokemonNextPage: () => Promise<void>
}

/**
 * Фабрика стора для покемонов одного поколения.
 *
 * Каждый вызов создаёт полностью изолированный стор:
 * - `createApiRequest` с путём `/generation/${id}/pokemon` (свой `AbortController`)
 * - `listRequestId` в замыкании фабрики
 * - `createPaginationModel` + `createLoadingStageModel` × 2
 *
 * @param generationId — id поколения (Generation 1, 2, …)
 * @returns vanilla-стор Zustand
 */
function createGenerationPokemonStore(generationId: number) {
  const request = createApiRequest<GenerationPokemonListResponse>({
    path: `/generation/${generationId}/pokemon`,
  })

  /**
   * Идентификатор последнего запроса списка.
   *
   * Устаревший ответ не перезапишет данные более нового запроса.
   */
  let listRequestId = 0

  return createStore<GenerationPokemonState>()((set, get) => ({
    items: [],
    pagination: createPaginationModel(set, get, 'pagination', { limit: 8 }),
    loadingStage: createLoadingStageModel(set, get, 'loadingStage'),
    loadingMoreStage: createLoadingStageModel(set, get, 'loadingMoreStage'),

    fetchGenerationPokemonList: async () => {
      // Защита от повторного запроса при успехе или загрузке
      if (get().loadingStage.isSuccess || get().loadingStage.isLoading) {
        return
      }

      const requestId = ++listRequestId

      get().pagination.reset()
      get().loadingStage.loading()
      get().loadingMoreStage.reset()

      const result = await request.call({
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
      get().pagination.setTotal(result.data.total)
    },

    fetchGenerationPokemonNextPage: async () => {
      if (
        get().loadingStage.isLoading ||
        get().loadingMoreStage.isLoading ||
        !get().pagination.hasMore
      ) {
        return
      }

      get().loadingMoreStage.loading()
      get().pagination.next()

      const { limit, offset } = get().pagination

      const result = await request.call({
        query: { limit, offset },
      })

      if (result.isError) {
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
      get().pagination.setTotal(result.data.total)
    },
  }))
}

/**
 * Реестр сторов покемонов поколений.
 *
 * Ключ — `generation.id`, значение — vanilla-стор.
 * Кэширование нужно, чтобы при повторном монтировании карточки
 * состояние поколения сохранялось.
 */
const storeRegistry = new Map<
  number,
  ReturnType<typeof createGenerationPokemonStore>
>()

/**
 * Получить или создать стор покемонов поколения.
 *
 * @param generationId — id поколения
 * @returns vanilla-стор Zustand
 */
export function getGenerationPokemonStore(generationId: number) {
  let store = storeRegistry.get(generationId)

  if (!isDefined(store)) {
    store = createGenerationPokemonStore(generationId)
    storeRegistry.set(generationId, store)
  }

  return store
}

/**
 * Тип стора покемонов поколения для передачи в компоненты.
 *
 * Выводится из фабрики, чтобы не дублировать `StoreApi<...>` вручную.
 */
export type GenerationPokemonStoreApi = ReturnType<
  typeof getGenerationPokemonStore
>
