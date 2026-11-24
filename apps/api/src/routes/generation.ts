import {
  generationListResponseSchema,
  generationPokemonListResponseSchema,
  idParamsSchema,
  notFoundResponseSchema,
  paginationQuerySchema,
} from '@pokemon-rest/shared'
import { count, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

import { db } from '../db/client'
import { generationsTable, pokemonTable } from '../db/schema'

export const generationRoute: FastifyPluginAsyncZod = async (app) => {
  // GET /api/generation — список поколений с пагинацией
  app.get(
    '/generation',
    {
      schema: {
        querystring: paginationQuerySchema,
        response: { 200: generationListResponseSchema },
      },
    },
    async (request) => {
      const { offset, limit } = request.query

      const [countResult] = await db
        .select({ count: count() })
        .from(generationsTable)

      const items = await db
        .select({
          id: generationsTable.id,
          name: generationsTable.name,
        })
        .from(generationsTable)
        .orderBy(generationsTable.id)
        .limit(limit)
        .offset(offset)

      return {
        items,
        total: Number(countResult.count),
      }
    },
  )

  // GET /api/generation/:id/pokemon — покемоны поколения с пагинацией
  app.get(
    '/generation/:id/pokemon',
    {
      schema: {
        params: idParamsSchema,
        querystring: paginationQuerySchema,
        response: {
          200: generationPokemonListResponseSchema,
          404: notFoundResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const { offset, limit } = request.query

      // Поколение должно существовать в справочнике — иначе 404
      const [generation] = await db
        .select({ id: generationsTable.id })
        .from(generationsTable)
        .where(eq(generationsTable.id, id))

      if (!generation) {
        return reply.code(404).send({ message: `Generation ${id} not found` })
      }

      const conditions = eq(pokemonTable.generationId, id)

      const [countResult] = await db
        .select({ count: count() })
        .from(pokemonTable)
        .where(conditions)

      const items = await db
        .select({
          id: pokemonTable.id,
          name: pokemonTable.name,
          spriteUrl: pokemonTable.spriteUrl,
          color: pokemonTable.color,
          description: pokemonTable.description,
          baseExperience: pokemonTable.baseExperience,
          hp: pokemonTable.hp,
          attack: pokemonTable.attack,
          defense: pokemonTable.defense,
          specialAttack: pokemonTable.specialAttack,
          specialDefense: pokemonTable.specialDefense,
        })
        .from(pokemonTable)
        .where(conditions)
        .orderBy(pokemonTable.id)
        .limit(limit)
        .offset(offset)

      return {
        items,
        total: Number(countResult.count),
      }
    },
  )
}
