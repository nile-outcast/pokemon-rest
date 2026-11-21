import type { PokemonListItem } from '@pokemon-rest/shared'
import { memo, useMemo } from 'react'

import './PokemonCard.css'

type PokemonCardProps = {
  pokemon: PokemonListItem
}

type Stat = {
  name: string
  value: number
}

export const PokemonCard = memo(({ pokemon }: PokemonCardProps) => {
  const stats: Array<Stat> = useMemo(
    () => [
      {
        name: 'Attack',
        value: pokemon.attack,
      },
      {
        name: 'Defense',
        value: pokemon.defense,
      },
    ],
    [pokemon],
  )

  return (
    <div className="pokemon-card">
      <div className="pokemon-card__content">
        <span className="pokemon-card__name">{pokemon.name}</span>
        <div className="pokemon-card__list">
          {stats.map((stat) => (
            <div key={stat.name} className="pokemon-card__stat">
              <span className="pokemon-card__stat-value">{stat.value}</span>
              <span className="pokemon-card__stat-name">{stat.name}</span>
            </div>
          ))}
        </div>
        <div className="pokemon-card__list">
          {pokemon.types.map((type) => (
            <span
              key={type.name}
              className="pokemon-card__type"
              style={{ backgroundColor: type.color }}
            >
              {type.name}
            </span>
          ))}
        </div>
      </div>
      <img
        className="pokemon-card__image"
        src={pokemon.spriteUrl ?? undefined}
        alt={pokemon.name}
        style={{
          backgroundColor: pokemon.color,
        }}
      />
    </div>
  )
})
