import type { BaseEntity } from '@pokemon-rest/shared'
import { memo } from 'react'

import { getGenerationPokemonStore } from '@/entities/generation'
import {
  GenerationPokemonDetail,
  GenerationPokemonList,
} from '@/features/generation-pokemon-list'

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

  return (
    <div className="generation-card">
      <h2 className="generation-card__title">Generation {generation.id}</h2>

      <GenerationPokemonDetail store={store} />

      <div className="generation-card__pokemon-list">
        <GenerationPokemonList store={store} />
      </div>
    </div>
  )
})
