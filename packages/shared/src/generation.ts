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

/** Ответ списка покемонов поколения */
export const generationPokemonListResponseSchema =
  createListResponseSchema(pokemonCardSchema)

export type GenerationPokemonListResponse = z.infer<
  typeof generationPokemonListResponseSchema
>
