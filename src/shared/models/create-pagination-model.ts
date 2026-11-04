import { setSubModel } from '@/shared/helpers/set-sub-model'
import type { SubModelCreator } from '@/shared/types/sub-model-creator'

/**
 * Данные пагинации.
 *
 * Единственный источник правды — стор. Новое поле добавляется сюда,
 * оттуда попадает в публичный интерфейс и автоматически сохраняется
 * между пересозданиями объекта пагинации.
 */
interface PaginationData {
  offset: number
  total: number
}

/**
 * Начальные данные пагинации.
 */
const INITIAL_DATA: PaginationData = {
  offset: 0,
  total: 0,
}

/**
 * Конфигурация под-модели пагинации.
 */
export interface PaginationConfig {
  limit?: number
}

/**
 * Публичный интерфейс под-модели пагинации.
 *
 * Данные (`offset`, `total`) — обычные поля.
 * Вычисляемые значения — геттеры, читающие стор при каждом обращении.
 * Экшены создают новый объект пагинации и кладут его в стор.
 */
export interface PaginationModel extends Readonly<PaginationData> {
  readonly limit: number
  readonly currentPage: number
  readonly pageCount: number
  readonly isFirstPage: boolean
  readonly isLastPage: boolean
  readonly hasMore: boolean

  setPage: (pageNumber: number) => void
  next: () => void
  previous: () => void
  setTotal: (total: number) => void
  reset: () => void
}

const DEFAULT_LIMIT = 10

/**
 * Создаёт вложенную под-модель «пагинация».
 *
 * Вся под-модель лежит в одной ключ-области (`path`) и доступна как
 * `get().pagination.currentPage`.
 *
 * Как это работает:
 * - `limit` захватывается в замыкании из конфига (не меняется динамически);
 * - вычисляемые геттеры читают `get()[path]` при каждом обращении;
 * - экшены создают новый объект пагинации и кладут его в стор по ключу `path`.
 *   Новая ссылка нужна, чтобы zustand увидел изменение и уведомил подписчиков.
 *
 * @example
 * ```ts
 * interface PokemonStore {
 *   items: Array<Pokemon>
 *   pagination: PaginationModel
 *   fetchPokemonList: () => Promise<void>
 * }
 *
 * export const usePokemonStore = create<PokemonStore>()((set, get) => ({
 *   items: [],
 *   pagination: createPaginationModel(set, get, 'pagination', { limit: 40 }),
 *
 *   async fetchPokemonList() {
 *     const result = await fetchPage(get().pagination.offset)
 *
 *     get().pagination.setTotal(result.data.count)
 *     set({ items: normalizePokemonList(result.data) })
 *   },
 * }))
 * ```
 */
export const createPaginationModel: SubModelCreator<
  PaginationModel,
  PaginationConfig
> = (set, get, path, config) => {
  const limit = config?.limit ?? DEFAULT_LIMIT

  const getData = (): PaginationData => {
    return get()[path] as PaginationData
  }

  const setModel = (data: PaginationData) => {
    setSubModel(set, path, makeModel(data))
  }

  // Обычная функция-конструктор, а не стрелочная: вызывается из setModel
  // раньше своего объявления (hoisting), поэтому здесь нужен hoisted вид.
  function makeModel(data: PaginationData): PaginationModel {
    return {
      ...data,

      limit,

      get currentPage() {
        return Math.floor(getData().offset / limit) + 1
      },
      get pageCount() {
        return Math.ceil(getData().total / limit)
      },
      get isFirstPage() {
        return getData().offset === 0
      },
      get hasMore() {
        return getHasMore()
      },
      get isLastPage() {
        return !getHasMore()
      },

      setPage: (pageNumber) => {
        if (pageNumber < 1) return

        setModel({
          ...getData(),
          offset: (pageNumber - 1) * limit,
        })
      },

      next: () => {
        const current = getData()

        if (!getHasMore()) return

        setModel({
          ...current,
          offset: current.offset + limit,
        })
      },

      previous: () => {
        const current = getData()

        if (current.offset <= 0) return

        setModel({
          ...current,
          offset: Math.max(0, current.offset - limit),
        })
      },

      setTotal: (total) =>
        setModel({
          ...getData(),
          total,
        }),

      reset: () => setModel(INITIAL_DATA),
    }
  }

  // Геттер, вычисляемый из стора при каждом вызове.
  // Вынесен наружу, чтобы не дублировать вычисление в `next` и `isLastPage`.
  function getHasMore() {
    const current = getData()

    return current.offset + limit < current.total
  }

  return makeModel(INITIAL_DATA)
}
