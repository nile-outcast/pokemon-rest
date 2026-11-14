import type { PokemonType } from '@pokemon-rest/shared'

import './PokemonDetailTypes.css'

type PokemonDetailTypesProps = {
  types: Array<PokemonType>
}

/**
 * Теги типов покемона с цветами из API.
 */
export function PokemonDetailTypes({ types }: PokemonDetailTypesProps) {
  return (
    <div className="pokemon-detail__types">
      {types.map((type) => (
        <span
          key={type.name}
          className="pokemon-detail__type"
          style={{ backgroundColor: type.color }}
        >
          {type.name}
        </span>
      ))}
    </div>
  )
}
