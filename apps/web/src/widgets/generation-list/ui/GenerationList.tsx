import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'

import { useGenerationStore } from '@/entities/generation'
import { useIntersectionObserver } from '@/shared/hooks/use-intersection-observer'
import { Button } from '@/shared/ui/button/Button'
import { LoadStatus } from '@/shared/ui/load-status/LoadStatus'

import { GenerationCard } from './GenerationCard'

import './GenerationList.css'

export function GenerationList() {
  const { isLoading, isError, loadErrorMessage } = useGenerationStore(
    useShallow((state) => ({
      isLoading: state.loadingStage.isLoading,
      isError: state.loadingStage.isError,
      loadErrorMessage: state.loadingStage.errorMessage,
    })),
  )

  const { isLoadingMore, isErrorMore, loadMoreErrorMessage } =
    useGenerationStore(
      useShallow((state) => ({
        isLoadingMore: state.loadingMoreStage.isLoading,
        isErrorMore: state.loadingMoreStage.isError,
        loadMoreErrorMessage: state.loadingMoreStage.errorMessage,
      })),
    )

  const items = useGenerationStore((state) => state.items)
  const fetchGenerationList = useGenerationStore(
    (state) => state.fetchGenerationList,
  )
  const fetchNextPage = useGenerationStore((state) => state.fetchNextPage)

  useEffect(() => {
    void fetchGenerationList()
  }, [fetchGenerationList])

  const { setSentinelRef } = useIntersectionObserver<HTMLLIElement>({
    fetchMoreFn: fetchNextPage,
    isLoading: isLoading || isLoadingMore,
  })

  const isEmptyList = items.length === 0

  if (isLoading || isError || isEmptyList) {
    return (
      <div className="generation-list__centered">
        <LoadStatus
          isLoading={isLoading}
          isError={isError}
          isEmpty={isEmptyList}
          loadMessage="Загрузка поколений..."
          errorMessage={`Не удалось загрузить поколения${loadErrorMessage && `: ${loadErrorMessage}`}`}
          emptyMessage="Поколения не найдены"
          retry={fetchGenerationList}
        />
      </div>
    )
  }

  return (
    <ul className="generation-list">
      {items.map((generation) => (
        <li key={generation.id}>
          <GenerationCard generation={generation} />
        </li>
      ))}

      {isLoadingMore && <li className="generation-list__status">Загрузка…</li>}

      {isErrorMore ? (
        <li className="generation-list__more-error">
          <p className="generation-list__status">
            Не удалось догрузить поколения
            {loadMoreErrorMessage && `: ${loadMoreErrorMessage}`}
          </p>
          <Button onClick={fetchNextPage}>Дозагрузить</Button>
        </li>
      ) : (
        <li ref={setSentinelRef} className="generation-list__sentinel" />
      )}
    </ul>
  )
}
