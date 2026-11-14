import type { PokemonDetail } from '@pokemon-rest/shared'
import { isDefined, type Nullable } from 'typescript-extended-types'
import { create } from 'zustand'

import { toErrorMessage } from '@/shared/helpers/to-error-message'
import { createApiRequest } from '@/shared/models/create-api-request'
import {
  createLoadingStageModel,
  type LoadingStageModel,
} from '@/shared/models/create-loading-stage-model'

interface PokemonDetailState {
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
  retryPokemonDetail: () => void
}

/**
 * id запроса, ответ на который ещё актуален.
 *
 * Ответивший запрос с другим id считается устаревшим и не трогает ни
 * детали, ни стадию загрузки.
 */
let activeId: Nullable<number> = null

/**
 * Ручка запроса деталей.
 *
 * Путь зависит от id, поэтому запрос создаётся на вызов, а не один на стор.
 */
const pokemonDetailRequest = createApiRequest<PokemonDetail>()

export const usePokemonDetailStore = create<PokemonDetailState>()(
  (set, get) => ({
    detail: null,
    loadingStage: createLoadingStageModel(set, get, 'loadingStage'),

    fetchPokemonDetail: async (id) => {
      // Кэш: детали этого покемона уже на месте или уже грузятся
      if (
        activeId === id &&
        (get().loadingStage.isLoading || get().loadingStage.isSuccess)
      ) {
        return
      }

      activeId = id
      const { detail } = get()

      // Чужие детали не должны оставаться на экране во время загрузки
      if (isDefined(detail) && detail.id !== id) {
        set({ detail: null })
      }

      get().loadingStage.loading()

      const result = await pokemonDetailRequest.call({ path: `/pokemon/${id}` })

      // Ответ запроса, который уже не текущий, игнорируем целиком
      if (activeId !== id) {
        return
      }

      if (result.isError) {
        if (result.isCancelled) {
          return
        }

        get().loadingStage.error(toErrorMessage(result))

        return
      }

      set({ detail: result.data })
      get().loadingStage.success()
    },

    retryPokemonDetail: () => {
      if (isDefined(activeId)) {
        void get().fetchPokemonDetail(activeId)
      }
    },
  }),
)
