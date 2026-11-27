import type { BaseEntity, GenerationPokemonCard } from '@pokemon-rest/shared'

import type { LoadingStageModel } from '@/shared/models/create-loading-stage-model'
import type { PaginationModel } from '@/shared/models/create-pagination-model'

export interface GenerationState {
  items: Array<BaseEntity>
  pagination: PaginationModel
  loadingStage: LoadingStageModel
  loadingMoreStage: LoadingStageModel
  fetchGenerationList: () => Promise<void>
  fetchNextPage: () => Promise<void>
}

/**
 * Срез состояния одного поколения покемонов.
 */
export interface GenerationPokemonState {
  items: Array<GenerationPokemonCard>
  /**
   * Индекс выбранного покемона, а не его id: переключение стрелками
   * оперирует соседними позициями списка. По умолчанию выбран первый.
   */
  selectedIndex: number
  pagination: PaginationModel
  loadingStage: LoadingStageModel
  loadingMoreStage: LoadingStageModel
  selectPokemon: (index: number) => void
  selectPrevPokemon: VoidFunction
  selectNextPokemon: VoidFunction
  fetchGenerationPokemonList: () => Promise<void>
  fetchGenerationPokemonNextPage: () => Promise<void>
}
