import {
  pokemonFiltersResponseSchema,
  pokemonListQuerySchema,
  pokemonListResponseSchema,
} from '@pokemon-rest/shared'
import { and, count, eq, gte, ilike, inArray, lte, SQL, sql } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

import { db } from '../db/client'
import { pokemonTable, pokemonTypesTable, typesTable } from '../db/schema'

/**
 * Собирает условия WHERE из query-параметров.
 * Тип-фильтр не входит — он требует join и обрабатывается отдельно.
 */
function buildConditions(query: {
  search?: string
  attackMin?: number
  attackMax?: number
  experienceMin?: number
  experienceMax?: number
}) {
  const conditions: Array<SQL> = []

  if (query.search) {
    conditions.push(ilike(pokemonTable.name, `%${query.search}%`))
  }

  if (query.attackMin !== undefined) {
    conditions.push(gte(pokemonTable.attack, query.attackMin))
  }

  if (query.attackMax !== undefined) {
    conditions.push(lte(pokemonTable.attack, query.attackMax))
  }

  if (query.experienceMin !== undefined) {
    conditions.push(gte(pokemonTable.baseExperience, query.experienceMin))
  }

  if (query.experienceMax !== undefined) {
    conditions.push(lte(pokemonTable.baseExperience, query.experienceMax))
  }

  return conditions
}

export const pokemonRoute: FastifyPluginAsyncZod = async (app) => {
  // GET /api/pokemon — список с фильтрами и пагинацией
  app.get(
    '/pokemon',
    {
      schema: {
        querystring: pokemonListQuerySchema,
        response: { 200: pokemonListResponseSchema },
      },
    },
    async (request) => {
      const {
        search,
        types,
        attackMin,
        attackMax,
        experienceMin,
        experienceMax,
        offset,
        limit,
      } = request.query

      const conditions = buildConditions({
        search,
        attackMin,
        attackMax,
        experienceMin,
        experienceMax,
      })

      // Тип-фильтр через подзапрос: не нужен join для count
      if (types.length > 0) {
        const typeIds = await db
          .select({ id: pokemonTypesTable.pokemonId })
          .from(pokemonTypesTable)
          .where(inArray(pokemonTypesTable.typeId, types))

        conditions.push(
          inArray(
            pokemonTable.id,
            typeIds.map((r) => r.id),
          ),
        )
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Общее количество для hasMore
      const [countResult] = await db
        .select({ count: count() })
        .from(pokemonTable)
        .where(whereClause)

      // Элементы текущей страницы
      const items = await db
        .select({
          id: pokemonTable.id,
          name: pokemonTable.name,
          attack: pokemonTable.attack,
          defense: pokemonTable.defense,
          baseExperience: pokemonTable.baseExperience,
          spriteUrl: pokemonTable.spriteUrl,
        })
        .from(pokemonTable)
        .where(whereClause)
        .orderBy(pokemonTable.id)
        .limit(limit)
        .offset(offset)

      // Типы для отобранных покемонов — одним запросом
      const itemIds = items.map((i) => i.id)
      const typeRows =
        itemIds.length > 0
          ? await db
              .select({
                pokemonId: pokemonTypesTable.pokemonId,
                name: typesTable.name,
                slot: pokemonTypesTable.slot,
              })
              .from(pokemonTypesTable)
              .innerJoin(
                typesTable,
                eq(pokemonTypesTable.typeId, typesTable.id),
              )
              .where(inArray(pokemonTypesTable.pokemonId, itemIds))
              .orderBy(pokemonTypesTable.pokemonId, pokemonTypesTable.slot)
          : []

      // Собираем map pokemon_id → string[]
      const typesMap = new Map<number, Array<string>>()

      for (const row of typeRows) {
        const arr = typesMap.get(row.pokemonId)

        if (arr) {
          arr.push(row.name)
        } else {
          typesMap.set(row.pokemonId, [row.name])
        }
      }

      const responseItems = items.map((item) => ({
        ...item,
        types: typesMap.get(item.id) ?? [],
      }))

      return { items: responseItems, total: Number(countResult.count) }
    },
  )

  // GET /api/pokemon/filters — справочник для UI-фильтров
  app.get(
    '/pokemon/filters',
    {
      schema: {
        response: { 200: pokemonFiltersResponseSchema },
      },
    },
    async () => {
      const [typeList, attackRange, expRange] = await Promise.all([
        db
          .select({ id: typesTable.id, name: typesTable.name })
          .from(typesTable)
          .orderBy(typesTable.name),
        db
          .select({
            min: sql<number>`min(attack)::int`,
            max: sql<number>`max(attack)::int`,
          })
          .from(pokemonTable),
        db
          .select({
            min: sql<number>`min(base_experience)::int`,
            max: sql<number>`max(base_experience)::int`,
          })
          .from(pokemonTable),
      ])

      return {
        types: typeList,
        attack: attackRange[0],
        experience: expRange[0],
      }
    },
  )
}
