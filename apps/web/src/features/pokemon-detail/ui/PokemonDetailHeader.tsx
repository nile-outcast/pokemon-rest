import type { PokemonDetail } from '@pokemon-rest/shared'
import { isDefined, type Nullable } from 'typescript-extended-types'

import './PokemonDetailHeader.css'

type PokemonDetailHeaderProps = {
  name: string
  id: number
  detail: Nullable<PokemonDetail>
}

/**
 * Заголовок модалки: имя покемона, номер поколения и кружок с id.
 */
export function PokemonDetailHeader({
  name,
  id,
  detail,
}: PokemonDetailHeaderProps) {
  return (
    <div className="pokemon-detail__header">
      <h2 className="pokemon-detail__name">{name}</h2>

      <div className="pokemon-detail__header-meta">
        {isDefined(detail) && (
          <span className="pokemon-detail__generation">
            Generation {detail.generationId}
          </span>
        )}

        <span className="pokemon-detail__id-badge">{String(id)}</span>
      </div>
    </div>
  )
}
