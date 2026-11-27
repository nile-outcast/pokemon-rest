import { useCallback, useEffect, useRef } from 'react'
import { isNullish, type Nullable } from 'typescript-extended-types'

type UseScrollIntoViewOptions = {
  /**
   * Ключ, при смене которого прокручиваем элемент к краю контейнера.
   *
   * В React 18+ эффект срабатывает после отрисовки, поэтому ref уже
   * указывает на актуальный DOM-элемент. При смене ключа — новый
   * элемент заменяет старый, а предыдущий ref-колбэк получает `null`
   * и отписывается.
   */
  key: unknown
  /**
   * Прокручиваемый контейнер, внутри которого лежит целевой элемент.
   *
   * Прокрутка идёт только по оси X на этом контейнере, поэтому окно
   * страницы не сдвигается.
   */
  container: Nullable<Element>
  /**
   * Поведение прокрутки: `'smooth'` для плавной анимации или
   * `'auto'` для мгновенного перехода. По умолчанию — `'smooth'`.
   */
  behavior?: ScrollBehavior
}

/**
 * Прокрутка выбранного элемента к краю контейнера.
 *
 * Хук возвращает callback ref, который ставится на прокручиваемый
 * элемент. При смене `key` эффект находит текущий элемент и прокручивает container до него.
 *
 * @typeParam T - тип DOM-элемента, например `HTMLLIElement`.
 * @returns `setTargetRef` — callback ref для установки на элемент.
 *
 * @example
 * ```tsx
 * const { setTargetRef } = useScrollIntoView<HTMLLIElement>({
 *   key: selectedIndex,
 * })
 *
 * return <li ref={setTargetRef}>…</li>
 * ```
 */
export function useScrollIntoView<T extends Element>({
  key,
  container,
  behavior = 'smooth',
}: UseScrollIntoViewOptions): {
  setTargetRef: (el: Nullable<T>) => void
} {
  const targetRef = useRef<T>(null)

  /**
   * Callback ref: ставится на `ref` элемента списка.
   *
   * Стабилен между рендерами, пока стабильны параметры, поэтому
   * эффект срабатывает только при смене ключа.
   */
  const setTargetRef = useCallback((el: Nullable<T>) => {
    targetRef.current = el
  }, [])

  useEffect(() => {
    const target = targetRef.current

    if (isNullish(target) || isNullish(container)) {
      return
    }

    const targetRect = target.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    const targetLeft =
      targetRect.left - containerRect.left + container.scrollLeft

    const centeredLeft =
      targetLeft - (container.clientWidth - targetRect.width) / 2

    container.scrollTo({ left: centeredLeft, behavior })
  }, [key, behavior, container])

  return { setTargetRef }
}
