import { isDefined, type Nullable } from 'typescript-extended-types'

type Timer = ReturnType<typeof setTimeout>

interface DebouncedFn<T extends (...args: Array<unknown>) => unknown> {
  (this: ThisParameterType<T>, ...args: Parameters<T>): void
  cancel(): void
  flush(): void
}

export function debounce<T extends (...args: Array<unknown>) => unknown>(
  fn: T,
  delay: number,
): DebouncedFn<T> {
  let timer: Nullable<Timer> = null
  let lastArgs: Nullable<Parameters<T>> = null
  let lastThis: Nullable<ThisParameterType<T>> = null

  const invoke = () => {
    timer = null

    if (lastArgs) {
      const curArgs = lastArgs
      const curThis = lastThis
      lastArgs = null
      lastThis = null

      fn.call(curThis, ...curArgs)
    }
  }

  function back(this: ThisParameterType<T>, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    lastThis = this
    lastArgs = args

    if (isDefined(timer)) {
      clearTimeout(timer)
    }

    timer = setTimeout(invoke, delay)
  }

  return Object.assign(back, {
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
