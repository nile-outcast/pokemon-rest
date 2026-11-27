import type {
  PokemonDetail,
  PokemonFiltersResponse,
  PokemonListItem,
  PokemonListQuery,
} from '@pokemon-rest/shared'
import type { Nullable } from 'typescript-extended-types'

import type { DebouncedFn } from '@/shared/helpers/debounce'
import type { LoadingStageModel } from '@/shared/models/create-loading-stage-model'
import type { PaginationModel } from '@/shared/models/create-pagination-model'
import type { ValueModel } from '@/shared/models/create-value-model'
import type { RangeValue } from '@/shared/types/values'

/** Фильтры списка без пагинации */
export type PokemonFilters = Omit<PokemonListQuery, 'limit' | 'offset'>

export interface PokemonFiltersSlice {
  readonly search: ValueModel
  readonly types: ValueModel<Array<number>>
  readonly attack: ValueModel<RangeValue>
  readonly experience: ValueModel<RangeValue>

  readonly filters: () => PokemonFilters

  filtersCatalog: Nullable<PokemonFiltersResponse>
  filtersLoadingStage: LoadingStageModel
  fetchFiltersCatalog: () => Promise<void>
}

export interface PokemonState extends PokemonFiltersSlice {
  items: Array<PokemonListItem>
  pagination: PaginationModel
  loadingStage: LoadingStageModel
  loadingMoreStage: LoadingStageModel
  fetchPokemonList: () => Promise<void>
  fetchNextPage: () => Promise<void>
  debouncedFetchPokemonList: DebouncedFn<() => Promise<void>>
}

export interface PokemonDetailState {
  /**
   * Детали загруженного покемона.
   *
   * Сбрасываются при запросе другого id, чтобы в модалке не осталось чужих
   * цифр. Сохраняются при повторном открытии того же покемона — это кэш,
   * второй запрос не нужен.
   */
  detail: Nullable<PokemonDetail>
  loadingStage: LoadingStageModel
  fetchPokemonDetail: (id: number) => Promise<void>
  retryPokemonDetail: VoidFunction
}
