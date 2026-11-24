import { z } from 'zod'

import { baseEntitySchema, createListResponseSchema } from './common'
import { pokemonCardSchema } from './pokemon'

/**
 * Контракты эндпоинтов GET /api/generation и GET /api/generation/:id/pokemon.
 *
 * Типы выводятся через z.infer — никаких ручных `T | null` или `T[]`.
 */

/** Ответ списка поколений: элементы плюс общее количество */
export const generationListResponseSchema =
  createListResponseSchema(baseEntitySchema)

export type GenerationListResponse = z.infer<
  typeof generationListResponseSchema
>

/**
 * Элемент списка покемонов поколения.
 *
 * Содержит базовую карточку (id, name, spriteUrl, color) плюс
 * пять статов и описание вида.
 */
export const generationPokemonCardSchema = pokemonCardSchema.extend({
  hp: z.number().int(),
  attack: z.number().int(),
  defense: z.number().int(),
  specialAttack: z.number().int(),
  specialDefense: z.number().int(),
  baseExperience: z.number().int(),
  description: z.string().nullable(),
})

export type GenerationPokemonCard = z.infer<typeof generationPokemonCardSchema>

/** Ответ списка покемонов поколения */
export const generationPokemonListResponseSchema = createListResponseSchema(
  generationPokemonCardSchema,
)

export type GenerationPokemonListResponse = z.infer<
  typeof generationPokemonListResponseSchema
>
