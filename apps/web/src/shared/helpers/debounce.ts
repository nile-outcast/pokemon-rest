import { isDefined, type Nullable } from 'typescript-extended-types'

type Timer = ReturnType<typeof setTimeout>

/**
 * Обёртка из `debounce`: вызов с отложенным срабатыванием плюс управление
 * pending-вызовом.
 *
 * Возврат `fn` отбрасывается — подписка всегда `void`, поэтому асинхронную
 * работу нельзя дождаться или поймать через `try/catch` снаружи.
 *
 * Методы не обращаются к `this`, их можно передавать оторванной ссылкой —
 * cleanup-ом в `useEffect` или prop-ом компонента.
 */
export interface DebouncedFn<T extends (...args: Array<unknown>) => unknown> {
  (this: ThisParameterType<T>, ...args: Parameters<T>): void

  /**
   * Отменяет pending-вызов и забывает его аргументы.
   *
   * Обязателен при размонтировании: иначе отложенный вызов сработает после
   * unmount. Без активного таймера — no-op.
   */
  cancel(): void

  /**
   * Выполняет pending-вызов немедленно, не дожидаясь окончания `delay`.
   *
   * Работает только пока таймер активен. Если вызов уже состоялся или его
   * вообще не планировали, `flush` ничего не делает и нового вызова не
   * создаёт — это не способ «применить текущее значение», а способ «доставить
   * ожидающий вызов прямо сейчас».
   */
  flush(): void
}

/**
 * Откладывает вызов `fn`: из группы вызовов выполняется только последний,
 * через `delay` после затухания.
 *
 * Лидирующей кромки нет: пока между вызовами проходит меньше `delay`, `fn`
 * не выполняется вовсе. Промежуточные аргументы теряются — в замыкании held
 * один слот под последний вызов.
 *
 * Состояние (таймер и аргументы) живёт в замыкании, поэтому экземпляр
 * создают один раз вне рендера — в сторе или в модуле. Создание внутри
 * компонента каждый рендер обнуляет таймер и гарантированно откладывает
 * вызов на полную `delay`.
 *
 * Инвариант: `isDefined(timer) ⟺ isDefined(lastArgs)`. Оба устанавливаются
 * при каждом вызове `debouncedFn` и сбрасываются в `invoke`, `cancel` или
 * `flush`. Это значит, что проверки `timer` и `lastArgs` взаимозаменяемы,
 * а `flush` без активного таймера — гарантированно no-op.
 *
 * @typeParam T - сигнатура оборачиваемой функции. Её `this` и аргументы
 * сохраняются, возврат — нет.
 * @param fn - функция, вызов которой откладывают.
 * @param delay - пауза в миллисекундах от последнего вызова до срабатывания.
 * @returns Функция с аргументами `fn`, но всегда `void`, и методами
 * `cancel`/`flush`.
 */
export function debounce<T extends (...args: Array<unknown>) => unknown>(
  fn: T,
  delay: number,
): DebouncedFn<T> {
  let timer: Nullable<Timer> = null
  let lastArgs: Nullable<Parameters<T>> = null
  let lastThis: Nullable<ThisParameterType<T>> = null

  const invoke = () => {
    timer = null

    if (isDefined(lastArgs)) {
      const curArgs = lastArgs
      const curThis = lastThis
      lastArgs = null
      lastThis = null

      fn.call(curThis, ...curArgs)
    }
  }

  function debouncedFn(this: ThisParameterType<T>, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this
    lastArgs = args

    if (isDefined(timer)) {
      clearTimeout(timer)
    }

    timer = setTimeout(invoke, delay)
  }

  return Object.assign(debouncedFn, {
    cancel() {
      if (isDefined(timer)) {
        clearTimeout(timer)
      }

      timer = null
      lastArgs = null
      lastThis = null
    },

    flush() {
      if (isDefined(timer)) {
        clearTimeout(timer)
        invoke()
      }
    },
  })
}
