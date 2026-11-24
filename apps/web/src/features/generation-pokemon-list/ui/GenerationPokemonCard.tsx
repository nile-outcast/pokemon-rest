import type { GenerationPokemonCard as GenerationPokemonCardModel } from '@pokemon-rest/shared'
import { memo } from 'react'

import { getPokemonSpriteUrl } from '@/shared/helpers/get-pokemon-sprite-url'
import './GenerationPokemonCard.css'

type GenerationPokemonCardProps = {
  pokemon: GenerationPokemonCardModel
  selected: boolean
  onSelect: (index: number) => void
  index: number
}

/**
 * Компактная карточка покемона для горизонтального списка поколения.
 *
 * Кликабельна: переключает выбранного покемона и подсвечивает
 * выбранную карточку рамкой.
 */
export const GenerationPokemonCard = memo(
  ({ pokemon, selected, onSelect, index }: GenerationPokemonCardProps) => {
    return (
      <button
        type="button"
        className={`generation-pokemon-card${selected ? ' generation-pokemon-card--selected' : ''}`}
        style={{ backgroundColor: pokemon.color }}
        onClick={() => onSelect(index)}
        aria-current={selected}
      >
        <img
          className="generation-pokemon-card__image"
          src={getPokemonSpriteUrl(pokemon.spriteUrl)}
          alt={pokemon.name}
        />
        <span className="generation-pokemon-card__name" title={pokemon.name}>
          {pokemon.name}
        </span>
      </button>
    )
  },
)
