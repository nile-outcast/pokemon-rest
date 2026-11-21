import type { PokemonCard } from '@pokemon-rest/shared'
import { memo } from 'react'

import './GenerationPokemonCard.css'

type GenerationPokemonCardProps = {
  pokemon: PokemonCard
}

/**
 * Компактная карточка покемона для горизонтального списка поколения.
 */
export const GenerationPokemonCard = memo(
  ({ pokemon }: GenerationPokemonCardProps) => {
    return (
      <div
        className="generation-pokemon-card"
        style={{ backgroundColor: pokemon.color }}
      >
        <img
          className="generation-pokemon-card__image"
          src={pokemon.spriteUrl ?? undefined}
          alt={pokemon.name}
        />
        <span className="generation-pokemon-card__name" title={pokemon.name}>
          {pokemon.name}
        </span>
      </div>
    )
  },
)
