import type { PokemonAbility } from '@pokemon-rest/shared'

import './PokemonDetailAbilities.css'

type PokemonDetailAbilitiesProps = {
  abilities: Array<PokemonAbility>
}

/**
 * Блок способностей: перечисление через « - ».
 * Если способностей нет — заглушка.
 */
export function PokemonDetailAbilities({
  abilities,
}: PokemonDetailAbilitiesProps) {
  return (
    <div className="pokemon-detail__abilities">
      <span className="pokemon-detail__abilities-label">Abilities</span>
      {abilities.length > 0 ? (
        <span className="pokemon-detail__abilities-list">
          {abilities.map((a, i) => (
            <span key={a.name}>
              {a.name}
              {a.isHidden && ' (скрытая)'}
              {i < abilities.length - 1 && ' - '}
            </span>
          ))}
        </span>
      ) : (
        <span className="pokemon-detail__abilities-empty">
          Способности не указаны
        </span>
      )}
    </div>
  )
}
