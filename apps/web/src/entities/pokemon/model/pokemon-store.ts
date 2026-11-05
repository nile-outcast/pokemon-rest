import { create } from 'zustand'

import type {
  PokemonListItem,
  PokemonListResponse,
} from '@/entities/pokemon/types'
import { POKEMON_API_BASE_URL } from '@/shared/config/pokemon-api'
import { POKEMON_QUERY_PARAM } from '@/shared/config/pokemon-query'
import { readQueryParam, writeQueryParams } from '@/shared/helpers/url-query'
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
  items: Array<PokemonListItem>
  /** Строка поиска по имени — часть query-состояния списка */
  search: string
  pagination: PaginationModel
  loadingStage: LoadingStageModel
  loadingMoreStage: LoadingStageModel
  setSearch: (value: string) => void
  fetchPokemonList: () => Promise<void>
  fetchNextPage: () => Promise<void>
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

/**
 * Идентификатор последнего запроса списка.
 *
 * При быстром вводе отмена прошлого запроса приходит уже после того, как
 * новый успел перейти в `loading`. Счётчик позволяет устаревшему ответу
 * не сбрасывать `loadingStage` более нового запроса.
 */
let listRequestId = 0

export const usePokemonStore = create<PokemonState>()((set, get) => ({
  items: [],
  search: readQueryParam(POKEMON_QUERY_PARAM.search) ?? '',
  pagination: createPaginationModel(set, get, 'pagination', { limit: 40 }),
  loadingStage: createLoadingStageModel(set, get, 'loadingStage'),
  loadingMoreStage: createLoadingStageModel(set, get, 'loadingMoreStage'),

  setSearch: (value: string) => {
    set({ search: value })
  },

  fetchPokemonList: async () => {
    if (get().loadingStage.isLoading || get().loadingMoreStage.isLoading) {
      pokemonListRequest.cancel()
    }

    // Смена фильтра всегда начинает с первой страницы: сброс делаем
    // один раз перед фактическим запросом, а не на каждый символ ввода
    get().pagination.reset()

    const trimmedSearch = get().search.trim()

    // В адресе фиксируем применённый фильтр — перезагрузка страницы
    // восстановит его из URL
    writeQueryParams({ [POKEMON_QUERY_PARAM.search]: trimmedSearch })

    get().loadingStage.loading()
    // Новая загрузка списка делает ошибку дозагрузки неактуальной
    get().loadingMoreStage.reset()

    const requestId = ++listRequestId

    const result = await pokemonListRequest.call({
      query: {
        limit: get().pagination.limit,
        offset: 0,
        search: trimmedSearch,
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
        search: get().search.trim(),
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
