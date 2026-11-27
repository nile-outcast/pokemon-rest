import type { PokemonListItem } from '@pokemon-rest/shared'
import { useEffect } from 'react'
import { isDefined } from 'typescript-extended-types'

import {
  STAT_LABEL,
  usePokemonDetailStore,
  usePokemonStore,
} from '@/entities/pokemon'
import { resolveImageUrl } from '@/shared/helpers/resolve-image-url'
import { StatBar } from '@/shared/ui/stat-bar/StatBar'

import { PokemonDetailAbilities } from './PokemonDetailAbilities'
import { PokemonDetailHeader } from './PokemonDetailHeader'
import { PokemonDetailStats } from './PokemonDetailStats'
import { PokemonDetailTypes } from './PokemonDetailTypes'

import './PokemonDetail.css'

type PokemonDetailProps = {
  pokemonItem: PokemonListItem
}

/**
 * Модальная карточка покемона: показывает данные из списка и дозагружает
 * подробности по `GET /api/pokemon/:id`.
 *
 * Оптимистичный рендер: фон, артворк, имя и теги типов берутся из
 * `pokemonItem` и видны сразу, детали (полоски, круги, способности)
 * появляются после ответа API. До ответа — `LoadStatus`.
 */
export function PokemonDetail({ pokemonItem }: PokemonDetailProps) {
  const detail = usePokemonDetailStore((state) => state.detail)
  const loadingStage = usePokemonDetailStore((state) => state.loadingStage)

  const fetchPokemonDetail = usePokemonDetailStore(
    (state) => state.fetchPokemonDetail,
  )
  const retryPokemonDetail = usePokemonDetailStore(
    (state) => state.retryPokemonDetail,
  )

  const filtersCatalog = usePokemonStore((state) => state.filtersCatalog)

  useEffect(() => {
    void fetchPokemonDetail(pokemonItem.id)
  }, [fetchPokemonDetail, pokemonItem.id])

  const isLoading = loadingStage.isLoading || loadingStage.isInitial

  return (
    <div
      className="pokemon-detail"
      style={{ backgroundColor: pokemonItem.color }}
    >
      <img
        className="pokemon-detail__image"
        src={resolveImageUrl(pokemonItem.spriteUrl)}
        alt={pokemonItem.name}
      />

      <div className="pokemon-detail__content">
        <PokemonDetailHeader
          name={pokemonItem.name}
          id={pokemonItem.id}
          detail={detail}
        />

        <PokemonDetailTypes types={pokemonItem.types} />

        {isLoading && (
          <p className="pokemon-detail__status">Загрузка деталей…</p>
        )}

        {loadingStage.isError && (
          <div className="pokemon-detail__error">
            <p className="pokemon-detail__error-message">
              Не удалось загрузить детали покемона
              {loadingStage.errorMessage && `: ${loadingStage.errorMessage}`}
            </p>

            <button
              className="pokemon-detail__retry"
              onClick={retryPokemonDetail}
              type="button"
            >
              Повторить
            </button>
          </div>
        )}

        {loadingStage.isSuccess && isDefined(detail) && (
          <div className="pokemon-detail__body">
            <PokemonDetailAbilities abilities={detail.abilities} />

            <div className="pokemon-detail__bars">
              <StatBar
                label={STAT_LABEL.hp}
                value={detail.hp}
                max={filtersCatalog?.hp.max ?? null}
              />

              <StatBar
                label={STAT_LABEL.baseExperience}
                value={detail.baseExperience}
                max={filtersCatalog?.experience.max ?? null}
              />
            </div>

            <PokemonDetailStats detail={detail} />
          </div>
        )}
      </div>
    </div>
  )
}
