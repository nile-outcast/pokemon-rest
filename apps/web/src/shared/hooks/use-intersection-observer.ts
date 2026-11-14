import { useCallback, useEffect, useRef } from 'react'
import { isNullish, type Nullable } from 'typescript-extended-types'

type UseIntersectionObserverParams = IntersectionObserverInit & {
  /**
   * Вызывается, когда sentinel попадает в область видимости.
   *
   * Хук не гейтит вызовы: защита от параллельных запросов (например,
   * проверка `isLoading` в сторе) остаётся на стороне `fetchMoreFn`.
   */
  fetchMoreFn: () => Promise<unknown>
  /**
   * Признак идущей загрузки — только для перезарядки observer'а.
   *
   * Пока `true`, перезарядка пропускается: sentinel всё равно не должен
   * ничего дозагружать. По переходу в `false` observer заново оценивает
   * позицию sentinel — иначе после смены списка элемент может остаться
   * во вьюпорте без нового события пересечения, и подгрузка не стартует.
   *
   * Без этого параметра перезарядка происходит только при монтировании,
   * поэтому для списка с подгрузкой его передавать нужно.
   */
  isLoading?: boolean
}

type UseIntersectionObserverResult<T extends Element> = {
  /**
   * Callback ref: ставится на `ref` sentinel-элемента. Наблюдатель
   * создаётся в момент появления элемента в DOM и уничтожается при его
   * удалении, поэтому повторное монтирование (смена разметки, переход
   * между состояниями) не оставляет висячего observer'а.
   */
  setSentinelRef: (el: Nullable<T>) => void
}

/**
 * Подгрузка по мере прокрутки: следит за sentinel-элементом и вызывает
 * `fetchMoreFn` при его появлении во вьюпорте.
 *
 * `root`, `rootMargin` и `threshold` наследуются от `IntersectionObserverInit`
 * и попадают в наблюдатель как есть. Значения должны быть **стабильными
 * между рендерами** (константа вне компонента, `useMemo`/`useCallback`):
 * `threshold` — массив, и новый литерал каждый рендер пересоздаёт колбэк
 * ref, а вместе с ним и observer. Свежий observer сразу сообщает текущее
 * пересечение, что при активном sentinel превращается в лавину запросов.
 *
 * Не заменяет пагинацию со стрелками: рассчитан на один sentinel-элемент
 * внизу списка и не умеет переключать направление прокрутки.
 *
 * @typeParam T - тип sentinel-элемента, например `HTMLLIElement`.
 * @returns `setSentinelRef` — callback ref для установки на sentinel.
 *
 * @example
 * ```tsx
 * const { setSentinelRef } = useIntersectionObserver<HTMLLIElement>({
 *   fetchMoreFn: fetchNextPage,
 *   isLoading: isLoading || isLoadingMore,
 * })
 *
 * return <li ref={setSentinelRef} className="pokemon-list__sentinel" />
 * ```
 */
export const useIntersectionObserver = <T extends Element>({
  fetchMoreFn,
  root,
  rootMargin = '0px 0px 200px',
  threshold,
  isLoading,
}: UseIntersectionObserverParams): UseIntersectionObserverResult<T> => {
  const sentinelRef = useRef<T>(null)
  const observerRef = useRef<IntersectionObserver>(null)

  // Callback ref: observer создаётся при появлении sentinel в DOM.
  // Колбэк стабилен, пока стабильны параметры наблюдателя, поэтому
  // при дозагрузке страниц observer не пересоздаётся.
  const setSentinelRef = useCallback(
    (sentinel: Nullable<T>) => {
      sentinelRef.current = sentinel

      if (isNullish(sentinel)) {
        observerRef.current?.disconnect()
        observerRef.current = null

        return
      }

      // Observer уже наблюдает за этим же элементом — не пересоздаём.
      if (observerRef.current) {
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            void fetchMoreFn()
          }
        },
        { root, rootMargin, threshold },
      )

      observer.observe(sentinel)
      observerRef.current = observer
    },
    [fetchMoreFn, root, rootMargin, threshold],
  )

  // Перезаряжаем observer после завершения загрузки: sentinel мог остаться
  // во вьюпорте — нового события пересечения не будет, и без перезарядки
  // дозагрузка не стартует.
  useEffect(() => {
    if (isLoading) {
      return
    }

    const sentinel = sentinelRef.current
    const observer = observerRef.current

    if (isNullish(sentinel) || isNullish(observer)) return

    observer.unobserve(sentinel)
    observer.observe(sentinel)
  }, [isLoading])

  return { setSentinelRef }
}
