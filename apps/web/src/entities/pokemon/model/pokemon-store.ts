import type { PokemonListItem, PokemonListResponse } from '@pokemon-rest/shared'
import { create } from 'zustand'

import { debounce, type DebouncedFn } from '@/shared/helpers/debounce'
import { toErrorMessage } from '@/shared/helpers/to-error-message'
import { writeQueryParams } from '@/shared/helpers/url-query'
import { createApiRequest } from '@/shared/models/create-api-request'
import {
  createLoadingStageModel,
  type LoadingStageModel,
} from '@/shared/models/create-loading-stage-model'
import {
  createPaginationModel,
  type PaginationModel,
} from '@/shared/models/create-pagination-model'

import {
  createPokemonFiltersSlice,
  type PokemonFiltersSlice,
} from './pokemon-filters-slice'

interface PokemonState extends PokemonFiltersSlice {
  items: Array<PokemonListItem>
  pagination: PaginationModel
  loadingStage: LoadingStageModel
  loadingMoreStage: LoadingStageModel
  fetchPokemonList: () => Promise<void>
  fetchNextPage: () => Promise<void>
  debouncedFetchPokemonList: DebouncedFn<() => Promise<void>>
}

const pokemonListRequest = createApiRequest<PokemonListResponse>({
  path: '/pokemon',
})

const DEBOUNCE_MS = 300

/**
 * Идентификатор последнего запроса списка.
 *
 * При быстром вводе отмена прошлого запроса приходит уже после того, как
 * новый успел перейти в `loading`. Счётчик позволяет устаревшему ответу
 * не сбрасывать `loadingStage` более нового запроса.
 */
let listRequestId = 0

export const usePokemonStore = create<PokemonState>()((set, get) => ({
  ...createPokemonFiltersSlice(set, get),
  items: [],
  loadingStage: createLoadingStageModel(set, get, 'loadingStage'),
  loadingMoreStage: createLoadingStageModel(set, get, 'loadingMoreStage'),

  pagination: createPaginationModel(set, get, 'pagination', { limit: 40 }),

  fetchPokemonList: async () => {
    if (get().loadingStage.isLoading || get().loadingMoreStage.isLoading) {
      pokemonListRequest.cancel()
    }

    const requestId = ++listRequestId

    // Смена фильтра всегда начинает с первой страницы: сброс делаем
    // один раз перед фактическим запросом, а не на каждый символ ввода
    get().pagination.reset()

    const filters = get().filters()

    // В адресе фиксируем применённый фильтр — перезагрузка страницы
    // восстановит его из URL
    writeQueryParams(filters)

    get().loadingStage.loading()
    // Новая загрузка списка делает ошибку дозагрузки неактуальной
    get().loadingMoreStage.reset()

    const result = await pokemonListRequest.call({
      query: {
        limit: get().pagination.limit,
        offset: 0,
        ...filters,
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

    const result = await pokemonListRequest.call({
      query: {
        limit,
        offset,
        ...get().filters(),
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

  debouncedFetchPokemonList: debounce(
    () => get().fetchPokemonList(),
    DEBOUNCE_MS,
  ),
}))
