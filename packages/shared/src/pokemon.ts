import { z } from 'zod'

import {
  baseEntitySchema,
  createListResponseSchema,
  numberRangeSchema,
  paginationQuerySchema,
} from './common'

/**
 * Контракты эндпоинта GET /api/pokemon/list.
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

/** Основа карточки покемона: id, name + артворк и цвет */
export const pokemonCardSchema = baseEntitySchema.extend({
  // Официальный артворк может отсутствовать у отдельных форм
  spriteUrl: z.string().nullable(),
  // Hex-значение цвета вида покемона — из pokemon-species.color (видовое тело)
  color: z.string(),
})

export type PokemonCard = z.infer<typeof pokemonCardSchema>

/** Элемент списка покемонов — всё, что нужно для карточки */
export const pokemonListItemSchema = pokemonCardSchema.extend({
  attack: z.number().int(),
  defense: z.number().int(),
  types: z.array(pokemonTypeSchema),
})

export type PokemonListItem = z.infer<typeof pokemonListItemSchema>

/** Query-параметры списка */
export const pokemonListQuerySchema = paginationQuerySchema.extend({
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
})

/** Выходной тип: offset/limit после default всегда определены */
export type PokemonListQuery = z.infer<typeof pokemonListQuerySchema>

/** Ответ списка: элементы плюс общее количество для hasMore */
export const pokemonListResponseSchema = createListResponseSchema(
  pokemonListItemSchema,
)

export type PokemonListResponse = z.infer<typeof pokemonListResponseSchema>

/** Ответ GET /api/pokemon/filters */
export const pokemonFiltersResponseSchema = z.object({
  types: z.array(baseEntitySchema),
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
export const pokemonDetailSchema = pokemonListItemSchema.extend({
  hp: z.number().int(),
  specialAttack: z.number().int(),
  specialDefense: z.number().int(),
  baseExperience: z.number().int(),
  generationId: z.number().int().positive(),
  abilities: z.array(pokemonAbilitySchema),
})

export type PokemonDetail = z.infer<typeof pokemonDetailSchema>
