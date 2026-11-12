import { Dialog } from '@base-ui/react/dialog'
import type { PokemonListItem } from '@pokemon-rest/shared'
import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'

import { usePokemonStore } from '@/entities/pokemon/model/pokemon-store'
import { PokemonCard } from '@/features/pokemon-card'
import { PokemonDetail } from '@/features/pokemon-detail'
import { useIntersectionObserver } from '@/shared/hooks/use-intersection-observer'
import { Button } from '@/shared/ui/button/Button'
import { LoadStatus } from '@/shared/ui/load-status/LoadStatus'

import './PokemonList.css'

const pokemonDetailsHandle = Dialog.createHandle<PokemonListItem>()

export function PokemonList() {
  const { isLoading, isError, loadErrorMessage } = usePokemonStore(
    useShallow((state) => ({
      isLoading: state.loadingStage.isLoading,
      isError: state.loadingStage.isError,
      loadErrorMessage: state.loadingStage.errorMessage,
    })),
  )

  const { isLoadingMore, isErrorMore, loadMoreErrorMessage } = usePokemonStore(
    useShallow((state) => ({
      isLoadingMore: state.loadingMoreStage.isLoading,
      isErrorMore: state.loadingMoreStage.isError,
      loadMoreErrorMessage: state.loadingMoreStage.errorMessage,
    })),
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

  const isEmptyList = items.length === 0

  if (isEmptyList && (isLoading || isError)) {
    return (
      <div className="pokemon-list__centered">
        <LoadStatus
          isLoading={isLoading}
          isError={isError}
          isEmpty={isEmptyList}
          loadMessage="Загрузка покемонов..."
          errorMessage={`Не удалось загрузить покемонов${loadErrorMessage && `: ${loadErrorMessage}`}`}
          emptyMessage="Покемоны не найдены"
          retry={fetchPokemonList}
        />
      </div>
    )
  }

  return (
    <>
      <ul className="pokemon-list">
        {items.map((pokemon) => (
          <Dialog.Trigger
            key={pokemon.id}
            handle={pokemonDetailsHandle}
            payload={pokemon}
            nativeButton={false}
            render={<li />}
          >
            <PokemonCard pokemon={pokemon} />
          </Dialog.Trigger>
        ))}

        {isErrorMore ? (
          <li className="pokemon-list__more-error">
            <p className="pokemon-list__status">
              Не удалось догрузить покемонов
              {loadMoreErrorMessage && `: ${loadMoreErrorMessage}`}
            </p>
            <Button onClick={fetchNextPage}>Дозагрузить</Button>
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

      <Dialog.Root handle={pokemonDetailsHandle}>
        {({ payload }) => (
          <Dialog.Portal>
            <Dialog.Backdrop className="pokemon-details__backdrop" />
            <Dialog.Popup className="pokemon-details__popup">
              {payload && <PokemonDetail pokemonItem={payload} />}
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </Dialog.Root>
    </>
  )
}
