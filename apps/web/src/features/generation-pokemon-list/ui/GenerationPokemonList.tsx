import { useState } from 'react'
import type { Nullable } from 'typescript-extended-types'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

import type { GenerationPokemonStoreApi } from '@/entities/generation/model/generation-pokemon-store'
import { useIntersectionObserver } from '@/shared/hooks/use-intersection-observer'
import { Button } from '@/shared/ui/button/Button'
import { LoadStatus } from '@/shared/ui/load-status/LoadStatus'

import { GenerationPokemonCard } from './GenerationPokemonCard'

import './GenerationPokemonList.css'

type GenerationPokemonListProps = {
  store: GenerationPokemonStoreApi
}

/**
 * Предзагрузка: sentinel засчитывается, когда до правого края ряда
 * остаётся 200px. Направлению соответствует горизонтальный скролл,
 * поэтому отступ — по оси X.
 */
const ROOT_MARGIN = '0px 200px 0px 0px'

/**
 * Горизонтальный список покемонов поколения с дозагрузкой по скроллу.
 *
 * Стор приходит снаружи: у каждого поколения собственный инстанс,
 * поэтому списки разных поколений полностью изолированы.
 */
export function GenerationPokemonList({ store }: GenerationPokemonListProps) {
  const { isLoading, isError, loadErrorMessage } = useStore(
    store,
    useShallow((state) => ({
      isLoading: state.loadingStage.isLoading,
      isError: state.loadingStage.isError,
      loadErrorMessage: state.loadingStage.errorMessage,
    })),
  )

  const { isLoadingMore, isErrorMore, loadMoreErrorMessage } = useStore(
    store,
    useShallow((state) => ({
      isLoadingMore: state.loadingMoreStage.isLoading,
      isErrorMore: state.loadingMoreStage.isError,
      loadMoreErrorMessage: state.loadingMoreStage.errorMessage,
    })),
  )

  const items = useStore(store, (state) => state.items)
  const fetchGenerationPokemonList = useStore(
    store,
    (state) => state.fetchGenerationPokemonList,
  )
  const fetchNextPage = useStore(
    store,
    (state) => state.fetchGenerationPokemonNextPage,
  )

  /**
   * Контейнер горизонтального скролла как `root` наблюдателя.
   *
   * В state, а не в ref: `ref.current` на первом рендере пуст, а нового
   * рендера установка ref не вызывает. Состояние же перерисовывает
   * компонент, observer пересоздаётся и начинает отслеживать пересечение
   * по правому краю контейнера, а не по вьюпорту.
   */
  const [scrollRoot, setScrollRoot] = useState<Nullable<HTMLUListElement>>(null)

  const { setSentinelRef } = useIntersectionObserver<HTMLLIElement>({
    fetchMoreFn: fetchNextPage,
    root: scrollRoot,
    rootMargin: ROOT_MARGIN,
    isLoading: isLoading || isLoadingMore,
  })

  const isEmptyList = items.length === 0

  if (isLoading || isError || isEmptyList) {
    return (
      <div className="generation-pokemon-list__centered">
        <LoadStatus
          isLoading={isLoading}
          isError={isError}
          isEmpty={isEmptyList}
          loadMessage="Загрузка покемонов..."
          errorMessage={`Не удалось загрузить покемонов${loadErrorMessage && `: ${loadErrorMessage}`}`}
          emptyMessage="Покемоны не найдены"
          retry={fetchGenerationPokemonList}
        />
      </div>
    )
  }

  return (
    <ul ref={setScrollRoot} className="generation-pokemon-list">
      {items.map((pokemon) => (
        <li key={pokemon.id}>
          <GenerationPokemonCard pokemon={pokemon} />
        </li>
      ))}

      {isLoadingMore && (
        <li className="generation-pokemon-list__status">Загрузка…</li>
      )}

      {isErrorMore ? (
        <li className="generation-pokemon-list__more-error">
          <p className="generation-pokemon-list__status">
            Не удалось догрузить покемонов
            {loadMoreErrorMessage && `: ${loadMoreErrorMessage}`}
          </p>
          <Button onClick={fetchNextPage}>Дозагрузить</Button>
        </li>
      ) : (
        <li
          ref={setSentinelRef}
          className="generation-pokemon-list__sentinel"
        />
      )}
    </ul>
  )
}
