import type { PokemonListItem } from '@pokemon-rest/shared'
import { useEffect } from 'react'
import { isDefined, isNullish } from 'typescript-extended-types'

import { usePokemonDetailStore } from '@/entities/pokemon/model/pokemon-detail-store'
import { usePokemonStore } from '@/entities/pokemon/model/pokemon-store'

import { PokemonDetailAbilities } from './PokemonDetailAbilities'
import { PokemonDetailBar } from './PokemonDetailBar'
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
      <div className="pokemon-detail__media">
        {isNullish(pokemonItem.spriteUrl) ? (
          <div className="pokemon-detail__image-placeholder" />
        ) : (
          <img
            className="pokemon-detail__image"
            src={pokemonItem.spriteUrl}
            alt={pokemonItem.name}
          />
        )}
      </div>

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
              <PokemonDetailBar
                label="Healthy Points"
                value={detail.hp}
                max={filtersCatalog?.hp.max ?? null}
              />

              <PokemonDetailBar
                label="Experience"
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
