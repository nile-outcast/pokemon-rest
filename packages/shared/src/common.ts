import { z } from 'zod'

/**
 * Общие контракты, переиспользуемые между эндпоинтами.
 *
 * Здесь собраны только те схемы, что встречаются в нескольких модулях:
 * базовая сущность справочника, пагинация, параметр :id, ответ 404,
 * границы числового диапазона и фабрика ответа-списка.
 */

/**
 * Базовая сущность справочника: числовой id и человекочитаемое name.
 * Наследуются через .extend() — так поле за полем собирается карточка
 * покемона или элемент списка поколений.
 */
export const baseEntitySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
})

export type BaseEntity = z.infer<typeof baseEntitySchema>

/**
 * Параметры пагинации. Числа приходят строками, поэтому z.coerce.
 * Значения по умолчанию: offset 0, limit 20, верхняя граница limit 100.
 */
export const paginationQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

/** Параметр :id в пути эндпоинта */
export const idParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type IdParams = z.infer<typeof idParamsSchema>

/** Ответ 404: текстовое описание причины */
export const notFoundResponseSchema = z.object({
  message: z.string(),
})

export type NotFoundResponse = z.infer<typeof notFoundResponseSchema>

/** Границы числового диапазона, чтобы пресеты строились из данных */
export const numberRangeSchema = z.object({
  min: z.number().int(),
  max: z.number().int(),
})

export type NumberRange = z.infer<typeof numberRangeSchema>

/**
 * Фабрика ответа-списка: элементы плюс общее количество для hasMore.
 * total всегда неотрицательное число, items — массив переданной схемы.
 */
export function createListResponseSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
  })
}
