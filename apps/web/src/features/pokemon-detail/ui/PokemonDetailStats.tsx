import type { PokemonDetail } from '@pokemon-rest/shared'

import './PokemonDetailStats.css'

type PokemonDetailStatsProps = {
  detail: PokemonDetail
}

/**
 * Четыре круглых значка статов: Defense, Attack, Sp Attack, Sp Defense.
 */
export function PokemonDetailStats({ detail }: PokemonDetailStatsProps) {
  const stats = [
    { label: 'Defense', value: detail.defense },
    { label: 'Attack', value: detail.attack },
    { label: 'Sp Attack', value: detail.specialAttack },
    { label: 'Sp Defense', value: detail.specialDefense },
  ]

  return (
    <div className="pokemon-detail__stats">
      {stats.map((stat) => (
        <div key={stat.label} className="pokemon-detail__stat">
          <span className="pokemon-detail__stat-value">{stat.value}</span>
          <span className="pokemon-detail__stat-label">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
