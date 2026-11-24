import type { BaseEntity } from '@pokemon-rest/shared'
import { memo, useEffect } from 'react'
import { useStore } from 'zustand'

import { getGenerationPokemonStore } from '@/entities/generation/model/generation-pokemon-store'
import { GenerationPokemonList } from '@/features/generation-pokemon-list'

import { GenerationPokemonDetail } from './GenerationPokemonDetail'

import './GenerationCard.css'

type GenerationCardProps = {
  generation: BaseEntity
}

/**
 * Карточка поколения — id, отформатированное имя (`Generation 1`),
 * блок выбранного покемона и горизонтальный список покемонов.
 *
 * Числовой `id` из справочника совпадает с нумерацией, как в детальной
 * карточке покемона (`Generation {generationId}`) — единый вид на всём
 * фронтенде.
 *
 * Стор покемонов берётся из реестра по `id`, поэтому у каждого поколения
 * свой изолированный список: загрузка в одном поколении не затирает
 * данные другого, и выбор покемона тоже свой.
 */
export const GenerationCard = memo(({ generation }: GenerationCardProps) => {
  const store = getGenerationPokemonStore(generation.id)

  const fetchGenerationPokemonList = useStore(
    store,
    (state) => state.fetchGenerationPokemonList,
  )

  useEffect(() => {
    void fetchGenerationPokemonList()
  }, [fetchGenerationPokemonList])

  return (
    <div className="generation-card">
      <h2 className="generation-card__title">Generation {generation.id}</h2>

      <GenerationPokemonDetail store={store} />

      <div className="generation-card__pokemon">
        <GenerationPokemonList store={store} />
      </div>
    </div>
  )
})
