import { useState } from 'react'
import { type Nullable } from 'typescript-extended-types'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

import type { GenerationPokemonStoreApi } from '@/entities/generation/model/generation-pokemon-store'
import { useIntersectionObserver } from '@/shared/hooks/use-intersection-observer'
import { useScrollIntoView } from '@/shared/hooks/use-scroll-into-view'
import { Button } from '@/shared/ui/button/Button'
import { LoadStatus } from '@/shared/ui/load-status/LoadStatus'

import { GenerationPokemonCard } from './GenerationPokemonCard'
import { GenerationPokemonListArrow } from './GenerationPokemonListArrow'

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
  const selectedIndex = useStore(store, (state) => state.selectedIndex)
  const selectPokemon = useStore(store, (state) => state.selectPokemon)
  const selectPrevPokemon = useStore(store, (state) => state.selectPrevPokemon)
  const selectNextPokemon = useStore(store, (state) => state.selectNextPokemon)
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

  /**
   * Прокрутка выбранной карточки в видимую область.
   *
   * `key: selectedIndex` — эффект хука срабатывает при смене выбранного
   * покемона (клик по карточке или стрелке) и доезжает до `li` с
   * callback ref.
   */
  const { setTargetRef } = useScrollIntoView<HTMLLIElement>({
    key: selectedIndex,
    container: scrollRoot,
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

  /**
   * Границы навигации стрелками.
   *
   * Считаются от уже загруженных `items`: `selectPokemon` сам отбрасывает
   * выход за диапазон, поэтому стрелки лишь отражают это в `disabled`.
   */
  const hasPrev = selectedIndex > 0
  const hasNext = selectedIndex < items.length - 1

  return (
    <div className="generation-pokemon-list__layout">
      <GenerationPokemonListArrow
        direction="prev"
        disabled={!hasPrev}
        onClick={selectPrevPokemon}
      />

      <ul ref={setScrollRoot} className="generation-pokemon-list">
        {items.map((pokemon, index) => (
          <li
            key={pokemon.id}
            ref={index === selectedIndex ? setTargetRef : null}
          >
            <GenerationPokemonCard
              pokemon={pokemon}
              index={index}
              selected={index === selectedIndex}
              onSelect={selectPokemon}
            />
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

      <GenerationPokemonListArrow
        direction="next"
        disabled={!hasNext}
        onClick={selectNextPokemon}
      />
    </div>
  )
}
