import { useEffect } from 'react'
import { isDefined, isNullish } from 'typescript-extended-types'
import { useStore } from 'zustand'

import {
  pokemonAt,
  type GenerationPokemonStoreApi,
} from '@/entities/generation'
import { STAT_LABEL, usePokemonStore } from '@/entities/pokemon'
import { resolveImageUrl } from '@/shared/helpers/resolve-image-url'
import { StatBar } from '@/shared/ui/stat-bar/StatBar'

import './GenerationPokemonDetail.css'

type GenerationPokemonDetailProps = {
  store: GenerationPokemonStoreApi
}

/**
 * Блок выбранного покемона поколения: артворк, имя, описание вида
 * и шесть полосок статов.
 *
 * Все данные приходят из `GET /api/generation/:id/pokemon/list` — отдельного
 * запроса за деталями нет. Масштаб полосок берётся из справочника
 * фильтров (`GET /api/pokemon/filters`), который на этой странице больше
 * нигде не запрашивается, поэтому дозагружается здесь.
 */
export function GenerationPokemonDetail({
  store,
}: GenerationPokemonDetailProps) {
  const pokemon = useStore(store, (state) =>
    pokemonAt(state.items, state.selectedIndex),
  )

  const filtersCatalog = usePokemonStore((state) => state.filtersCatalog)
  const fetchFiltersCatalog = usePokemonStore(
    (state) => state.fetchFiltersCatalog,
  )

  useEffect(() => {
    void fetchFiltersCatalog()
  }, [fetchFiltersCatalog])

  if (isNullish(pokemon)) {
    return null
  }

  const stats = [
    {
      label: STAT_LABEL.hp,
      value: pokemon.hp,
      max: filtersCatalog?.hp.max ?? null,
    },
    {
      label: STAT_LABEL.baseExperience,
      value: pokemon.baseExperience,
      max: filtersCatalog?.experience.max ?? null,
    },
    {
      label: STAT_LABEL.attack,
      value: pokemon.attack,
      max: filtersCatalog?.attack.max ?? null,
    },
    {
      label: STAT_LABEL.defense,
      value: pokemon.defense,
      max: filtersCatalog?.defense.max ?? null,
    },
    {
      label: STAT_LABEL.specialAttack,
      value: pokemon.specialAttack,
      max: filtersCatalog?.specialAttack.max ?? null,
    },
    {
      label: STAT_LABEL.specialDefense,
      value: pokemon.specialDefense,
      max: filtersCatalog?.specialDefense.max ?? null,
    },
  ]

  return (
    <div className="generation-pokemon-detail">
      <img
        className="generation-pokemon-detail__image"
        src={resolveImageUrl(pokemon.spriteUrl)}
        alt={pokemon.name}
      />

      <div className="generation-pokemon-detail__content">
        <h3 className="generation-pokemon-detail__name">{pokemon.name}</h3>

        {isDefined(pokemon.description) && (
          <p className="generation-pokemon-detail__description">
            {pokemon.description}
          </p>
        )}

        <div className="generation-pokemon-detail__stats">
          {stats.map((stat) => (
            <StatBar
              key={stat.label}
              label={stat.label}
              value={stat.value}
              max={stat.max}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
