import type { PokemonFiltersResponse } from '@pokemon-rest/shared'

import { POKEMON_API_BASE_URL } from '@/shared/config/pokemon-api'
import {
  POKEMON_QUERY_PARAM,
  type PokemonFilters,
} from '@/shared/config/pokemon-query'
import { toErrorMessage } from '@/shared/helpers/to-error-message'
import { readQueryParam } from '@/shared/helpers/url-query'
import { createApiRequest } from '@/shared/models/create-api-request'
import {
  createLoadingStageModel,
  type LoadingStageModel,
} from '@/shared/models/create-loading-stage-model'
import type { SliceCreator } from '@/shared/types/slice-creator'

export interface PokemonFiltersSlice {
  readonly search: string
  setSearch: (value: string) => void

  readonly filters: () => PokemonFilters

  filtersCatalog: PokemonFiltersResponse
  filtersLoadingStage: LoadingStageModel
  fetchFiltersCatalog: () => Promise<void>
}

const filtersRequest = createApiRequest<PokemonFiltersResponse, Error>(
  '/pokemon/filters',
  { baseUrl: POKEMON_API_BASE_URL },
)

const INITIAL_FILTERS_CATALOG: PokemonFiltersResponse = {
  types: [],
  attack: {
    min: 0,
    max: 0,
  },
  experience: {
    min: 0,
    max: 0,
  },
}

export const createPokemonFiltersSlice: SliceCreator<PokemonFiltersSlice> = (
  set,
  get,
) => {
  return {
    search: readQueryParam(POKEMON_QUERY_PARAM.search) ?? '',
    setSearch: (value: string) => {
      set({ search: value })
    },

    filters: () => ({
      [POKEMON_QUERY_PARAM.search]: get().search.trim(),
    }),

    filtersCatalog: INITIAL_FILTERS_CATALOG,
    filtersLoadingStage: createLoadingStageModel(
      set,
      get,
      'filtersLoadingStage',
    ),

    fetchFiltersCatalog: async () => {
      if (
        get().filtersLoadingStage.isLoading ||
        get().filtersLoadingStage.isSuccess
      ) {
        return
      }

      get().filtersLoadingStage.loading()

      const result = await filtersRequest.call()

      if (result.isError) {
        if (result.isCancelled) {
          get().filtersLoadingStage.reset()

          return
        }

        get().filtersLoadingStage.error(toErrorMessage(result))

        return
      }

      get().filtersLoadingStage.success()
      set({
        filtersCatalog: result.data,
      })
    },
  }
}
