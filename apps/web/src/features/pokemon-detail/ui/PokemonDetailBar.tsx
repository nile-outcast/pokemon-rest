import { isNullish, type Nullable } from 'typescript-extended-types'

import './PokemonDetailBar.css'

type PokemonDetailBarProps = {
  label: string
  value: number
  max: Nullable<number>
}

/**
 * Полоска прогресса: label, числовое значение и жёлтый fill.
 *
 * Масштаб берётся из справочника фильтров (hp.max / experience.max).
 * Если максимум недоступен — полоска пустая, но значение показывается.
 */
export function PokemonDetailBar({ label, value, max }: PokemonDetailBarProps) {
  const percent =
    isNullish(max) || max <= 0
      ? 0
      : Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="pokemon-detail__bar">
      <span className="pokemon-detail__bar-label">{label}</span>
      <div className="pokemon-detail__bar-track">
        <div
          className="pokemon-detail__bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="pokemon-detail__bar-value">{String(value)}</span>
    </div>
  )
}
