import type { PokemonListItem } from '@pokemon-rest/shared'

import './PokemonDetail.css'

type PokemonDetailProps = {
  pokemonItem: PokemonListItem
}

export function PokemonDetail({ pokemonItem }: PokemonDetailProps) {
  return (
    <div
      className="pokemon-detail"
      style={{
        backgroundColor: pokemonItem.color,
      }}
    >
      <img
        className="pokemon-detail__image"
        src={pokemonItem.spriteUrl ?? undefined}
        alt={pokemonItem.name}
      />
      <div className="pokemon-detail__content">{pokemonItem.name}</div>
    </div>
  )
}
