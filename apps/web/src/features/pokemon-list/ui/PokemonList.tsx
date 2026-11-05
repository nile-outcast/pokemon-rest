import { useEffect } from 'react'

import { usePokemonStore } from '@/entities/pokemon/model/pokemon-store'
import { useIntersectionObserver } from '@/shared/hooks/use-intersection-observer'

import './PokemonList.css'

export function PokemonList() {
  const isLoading = usePokemonStore((state) => state.loadingStage.isLoading)
  const loadErrorMessage = usePokemonStore(
    (state) => state.loadingStage.errorMessage,
  )
  const isLoadingMore = usePokemonStore(
    (state) => state.loadingMoreStage.isLoading,
  )
  const loadMoreErrorMessage = usePokemonStore(
    (state) => state.loadingMoreStage.errorMessage,
  )
  const items = usePokemonStore((state) => state.items)
  const fetchPokemonList = usePokemonStore((state) => state.fetchPokemonList)
  const fetchNextPage = usePokemonStore((state) => state.fetchNextPage)

  useEffect(() => {
    void fetchPokemonList()
  }, [fetchPokemonList])

  const { setSentinelRef } = useIntersectionObserver<HTMLLIElement>({
    fetchMoreFn: fetchNextPage,
    isLoading: isLoading || isLoadingMore,
  })

  if (items.length === 0) {
    if (isLoading) {
      return (
        <div className="pokemon-list__centered">
          <p className="pokemon-list__status">Загрузка покемонов…</p>
        </div>
      )
    }

    if (loadErrorMessage) {
      return (
        <div className="pokemon-list__centered">
          <div className="pokemon-list__error">
            <p>Не удалось загрузить покемонов: {loadErrorMessage}</p>
            <button
              type="button"
              className="pokemon-list__retry"
              onClick={() => void fetchPokemonList()}
            >
              Повторить
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="pokemon-list__centered">
        <p className="pokemon-list__status">Покемоны не найдены</p>
      </div>
    )
  }

  return (
    <ul className="pokemon-list">
      {items.map((pokemon) => (
        <li key={pokemon.id} className="pokemon-list__item">
          <span className="pokemon-list__id">
            #{String(pokemon.id).padStart(3, '0')}
          </span>
          <span className="pokemon-list__name">{pokemon.name}</span>
        </li>
      ))}

      {loadMoreErrorMessage ? (
        <li className="pokemon-list__more-error">
          <p className="pokemon-list__status">
            Не удалось догрузить: {loadMoreErrorMessage}
          </p>
          <button
            type="button"
            className="pokemon-list__retry"
            onClick={() => void fetchNextPage()}
          >
            Дозагрузить
          </button>
        </li>
      ) : (
        <li ref={setSentinelRef} className="pokemon-list__sentinel" />
      )}

      {isLoadingMore && (
        <li className="pokemon-list__status pokemon-list__status--inline">
          Загрузка…
        </li>
      )}
    </ul>
  )
}
