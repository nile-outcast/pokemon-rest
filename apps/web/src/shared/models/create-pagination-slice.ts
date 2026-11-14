import type { SliceCreator } from '@/shared/types/slice-creator'

export interface PaginationSlice {
  limit: number
  offset: number
  total: number
  hasMore: boolean

  setPage: (pageNumber: number) => void
  resetPagination: () => void
  getPageCount: () => number
}

export interface PaginationConfig {
  limit?: number
}

const DEFAULT_LIMIT = 10

/**
 * Переиспользуемый срез «пагинация».
 *
 * Микшируется в стор плоским слоем через спред:
 * `...createPaginationSlice(set, get, { limit: 20 })`.
 */
export const createPaginationSlice: SliceCreator<
  PaginationSlice,
  PaginationConfig
> = (set, get, config) => {
  const limit = config?.limit ?? DEFAULT_LIMIT

  return {
    limit,
    offset: 0,
    total: 0,
    hasMore: false,

    setPage: (pageNumber) => {
      if (pageNumber < 1) return

      set({ offset: (pageNumber - 1) * get().limit })
    },

    resetPagination: () => {
      set({
        offset: 0,
        total: 0,
        hasMore: false,
      })
    },

    getPageCount: () => Math.ceil(get().total / get().limit),
  }
}
