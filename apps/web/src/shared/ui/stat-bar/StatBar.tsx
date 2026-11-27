import { isNullish, type Nullable } from 'typescript-extended-types'

import './StatBar.css'

type StatBarProps = {
  label: string
  value: number
  max: Nullable<number>
}

/**
 * Переиспользуемая полоска стата: название, значение и процент заполнения.
 *
 * Масштаб задаётся снаружи — обычно максимумом из справочника фильтров
 * (`GET /api/pokemon/filters`). Если максимум недоступен, полоска остаётся
 * пустой, но числовое значение показывается.
 */
export function StatBar({ label, value, max }: StatBarProps) {
  const percent =
    isNullish(max) || max <= 0
      ? 0
      : Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className="stat-bar">
      <span className="stat-bar__label">{label}</span>
      <span className="stat-bar__value">{String(value)}</span>
      <div className="stat-bar__track">
        <div className="stat-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
