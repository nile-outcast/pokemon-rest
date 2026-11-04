import { create } from 'zustand'

import type { Pokemon, PokemonListResponse } from '@/entities/pokemon/types'
import { POKEMON_API_BASE_URL } from '@/shared/config/pokemon-api'
import { createApiRequest } from '@/shared/models/create-api-request'
import {
  createLoadingStageModel,
  type LoadingStageModel,
} from '@/shared/models/create-loading-stage-model'
import {
  createPaginationModel,
  type PaginationModel,
} from '@/shared/models/create-pagination-model'
import type { ApiCallErrorResponse } from '@/shared/types/api-call'

interface PokemonState {
  items: Array<Pokemon>
  pagination: PaginationModel
  loadingStage: LoadingStageModel
  loadingMoreStage: LoadingStageModel
  fetchPokemonList: () => Promise<void>
  fetchNextPage: () => Promise<void>
}

function normalizePokemonList(response: PokemonListResponse): Array<Pokemon> {
  return response.results.map((raw) => ({
    id: Number(raw.url.match(/\/pokemon\/(\d+)\/$/)?.[1] ?? 0),
    name: raw.name,
  }))
}

function toErrorMessage(response: ApiCallErrorResponse<Error>): string {
  if (response.data) {
    return `Ошибка сервера: ${response.data.message}`
  }

  return 'Неизвестная ошибка'
}

const pokemonListRequest = createApiRequest<PokemonListResponse, Error>(
  `/pokemon`,
  {
    baseUrl: POKEMON_API_BASE_URL,
  },
)

export const usePokemonStore = create<PokemonState>()((set, get) => ({
  items: [],
  pagination: createPaginationModel(set, get, 'pagination', { limit: 40 }),
  loadingStage: createLoadingStageModel(set, get, 'loadingStage'),
  loadingMoreStage: createLoadingStageModel(set, get, 'loadingMoreStage'),

  fetchPokemonList: async () => {
    if (get().loadingStage.isLoading) return

    get().loadingStage.loading()
    // Новая загрузка списка делает ошибку дозагрузки неактуальной
    get().loadingMoreStage.reset()

    const result = await pokemonListRequest.call({
      query: {
        limit: get().pagination.limit,
        offset: 0,
      },
    })

    if (result.isError) {
      if (result.isCancelled) {
        get().loadingStage.reset()

        return
      }

      get().loadingStage.error(toErrorMessage(result))

      return
    }

    get().loadingStage.success()

    set({ items: normalizePokemonList(result.data) })

    // offset под-модели — начало текущей страницы: загружена первая, значит 0
    get().pagination.reset()
    get().pagination.setTotal(result.data.count)
  },

  fetchNextPage: async () => {
    // Защита от параллельных запросов и загрузки при отсутствии данных
    if (get().loadingMoreStage.isLoading || !get().pagination.hasMore) return

    get().loadingMoreStage.loading()
    // Оптимистичный переход: offset под-модели — начало текущей страницы,
    // поэтому следующая страница уже сдвинута и запрашивается как текущая
    get().pagination.next()

    const { limit, offset } = get().pagination

    const result = await pokemonListRequest.call({
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

    set({ items: [...get().items, ...normalizePokemonList(result.data)] })

    // Фиксируем total: от него зависит hasMore для следующего перехода
    get().pagination.setTotal(result.data.count)
  },
}))
