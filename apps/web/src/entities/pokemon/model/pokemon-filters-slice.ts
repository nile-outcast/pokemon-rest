import {
  pokemonListQuerySchema,
  type PokemonFiltersResponse,
  type PokemonListQuery,
} from '@pokemon-rest/shared'

import { POKEMON_API_BASE_URL } from '@/shared/config/pokemon-api'
import { toErrorMessage } from '@/shared/helpers/to-error-message'
import { readQueryParams } from '@/shared/helpers/url-query'
import { createApiRequest } from '@/shared/models/create-api-request'
import {
  createLoadingStageModel,
  type LoadingStageModel,
} from '@/shared/models/create-loading-stage-model'
import {
  createValueModel,
  type ValueModel,
} from '@/shared/models/create-value-model'
import type { SliceCreator } from '@/shared/types/slice-creator'
import type { RangeValue } from '@/shared/types/values'

type PokemonFilters = Omit<PokemonListQuery, 'limit' | 'offset'>

export interface PokemonFiltersSlice {
  readonly search: ValueModel
  readonly types: ValueModel<Array<number>>
  readonly attack: ValueModel<RangeValue>
  readonly experience: ValueModel<RangeValue>

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
  const queryParams = readQueryParams(pokemonListQuerySchema)

  return {
    search: createValueModel()(set, get, 'search', {
      initialValue: queryParams.search ?? '',
    }),

    types: createValueModel<Array<number>>()(set, get, 'types', {
      initialValue: queryParams.types ?? [],
    }),

    attack: createValueModel<RangeValue>()(set, get, 'attack', {
      initialValue: {
        min: queryParams.attackMin ?? null,
        max: queryParams.attackMax ?? null,
      },
    }),

    experience: createValueModel<RangeValue>()(set, get, 'experience', {
      initialValue: {
        min: queryParams.experienceMin ?? null,
        max: queryParams.experienceMax ?? null,
      },
    }),

    filters: () => {
      const { search, types, attack, experience } = get()

      return {
        search: search.value.trim(),
        types: types.value,
        attackMin: attack.value.min ?? undefined,
        attackMax: attack.value.max ?? undefined,
        experienceMin: experience.value.min ?? undefined,
        experienceMax: experience.value.max ?? undefined,
      }
    },

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
