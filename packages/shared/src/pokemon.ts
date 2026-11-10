import { z } from 'zod'

/**
 * Контракты эндпоинта GET /api/pokemon.
 *
 * Типы публичные выводятся через z.infer — соглашения проекта про
 * `Array<T>` и `Nullable<T>` относятся к вручную написанным аннотациям,
 * а здесь типы генерирует zod, поэтому в исходнике нет ни `T[]`, ни `T | null`.
 */

/** Тип покемона с цветом для карточки */
export const pokemonTypeSchema = z.object({
  name: z.string(),
  color: z.string(),
})

export type PokemonType = z.infer<typeof pokemonTypeSchema>

/** Элемент списка покемонов — всё, что нужно для карточки */
export const pokemonListItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  // Официальный артворк может отсутствовать у отдельных форм
  spriteUrl: z.string().nullable(),
  // Hex-значение цвета вида покемона — из pokemon-species.color (видовое тело)
  color: z.string(),
  attack: z.number().int(),
  defense: z.number().int(),
  types: z.array(pokemonTypeSchema),
})

export type PokemonListItem = z.infer<typeof pokemonListItemSchema>

/** Query-параметры списка. Числа приходят строками, поэтому z.coerce */
export const pokemonListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  types: z
    .preprocess(
      (value) => (Array.isArray(value) ? value : [value]),
      z.array(z.coerce.number().int()),
    )
    .default([]),
  attackMin: z.coerce.number().int().min(0).optional(),
  attackMax: z.coerce.number().int().min(0).optional(),
  experienceMin: z.coerce.number().int().min(0).optional(),
  experienceMax: z.coerce.number().int().min(0).optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

/** Выходной тип: offset/limit после default всегда определены */
export type PokemonListQuery = z.infer<typeof pokemonListQuerySchema>

/** Тип query до валидации — используется фронтендом при сборке запроса */
export type PokemonListQueryInput = z.input<typeof pokemonListQuerySchema>

/** Ответ списка: элементы плюс общее количество для hasMore */
export const pokemonListResponseSchema = z.object({
  items: z.array(pokemonListItemSchema),
  total: z.number().int().min(0),
})

export type PokemonListResponse = z.infer<typeof pokemonListResponseSchema>

/** Опция селекта типа — id для key, name для значения */
export const pokemonOptionSchema = z.object({
  id: z.number().int(),
  name: z.string(),
})

export type PokemonOption = z.infer<typeof pokemonOptionSchema>

/** Границы числового диапазона, чтобы пресеты строились из данных */
export const numberRangeSchema = z.object({
  min: z.number().int(),
  max: z.number().int(),
})

export type NumberRange = z.infer<typeof numberRangeSchema>

/** Ответ GET /api/pokemon/filters */
export const pokemonFiltersResponseSchema = z.object({
  types: z.array(pokemonOptionSchema),
  hp: numberRangeSchema,
  attack: numberRangeSchema,
  defense: numberRangeSchema,
  specialAttack: numberRangeSchema,
  specialDefense: numberRangeSchema,
  experience: numberRangeSchema,
})

export type PokemonFiltersResponse = z.infer<
  typeof pokemonFiltersResponseSchema
>

/** Элемент списка способностей */
export const pokemonAbilitySchema = z.object({
  name: z.string(),
  isHidden: z.boolean(),
})

export type PokemonAbility = z.infer<typeof pokemonAbilitySchema>

/** Детальная карточка покемона — GET /api/pokemon/:id */
export const pokemonDetailParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const pokemonDetailSchema = pokemonListItemSchema.extend({
  hp: z.number().int(),
  specialAttack: z.number().int(),
  specialDefense: z.number().int(),
  baseExperience: z.number().int(),
  generationId: z.number().int().positive(),
  abilities: z.array(pokemonAbilitySchema),
})

export type PokemonDetail = z.infer<typeof pokemonDetailSchema>

/** Ответ 404 для детального эндпоинта */
export const pokemonNotFoundResponseSchema = z.object({
  message: z.string(),
})

export type PokemonNotFoundResponse = z.infer<
  typeof pokemonNotFoundResponseSchema
>
