import type { PokemonDetail } from '@pokemon-rest/shared'

import { STAT_LABEL_SHORT } from '@/shared/config/stat-labels'

import './PokemonDetailStats.css'

type PokemonDetailStatsProps = {
  detail: PokemonDetail
}

/**
 * Четыре круглых значка статов: Defense, Attack, Sp Attack, Sp Defense.
 */
export function PokemonDetailStats({ detail }: PokemonDetailStatsProps) {
  const stats = [
    { label: STAT_LABEL_SHORT.defense, value: detail.defense },
    { label: STAT_LABEL_SHORT.attack, value: detail.attack },
    { label: STAT_LABEL_SHORT.specialAttack, value: detail.specialAttack },
    { label: STAT_LABEL_SHORT.specialDefense, value: detail.specialDefense },
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
