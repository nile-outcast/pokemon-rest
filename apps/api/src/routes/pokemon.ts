import {
  pokemonDetailParamsSchema,
  pokemonDetailSchema,
  pokemonFiltersResponseSchema,
  pokemonListQuerySchema,
  pokemonListResponseSchema,
  pokemonNotFoundResponseSchema,
  type PokemonType,
} from '@pokemon-rest/shared'
import { and, count, eq, gte, ilike, inArray, lte, SQL, sql } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

import { db } from '../db/client'
import {
  abilitiesTable,
  pokemonAbilitiesTable,
  pokemonTable,
  pokemonTypesTable,
  typesTable,
} from '../db/schema'

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
          spriteUrl: pokemonTable.spriteUrl,
          color: pokemonTable.color,
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
                color: typesTable.color,
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

      // Собираем map pokemon_id → PokemonType[]
      const typesMap = new Map<number, Array<PokemonType>>()

      for (const row of typeRows) {
        const arr = typesMap.get(row.pokemonId)

        const pokemonType: PokemonType = {
          name: row.name,
          color: row.color,
        }

        if (arr) {
          arr.push(pokemonType)
        } else {
          typesMap.set(row.pokemonId, [pokemonType])
        }
      }

      const responseItems = items.map((item) => ({
        ...item,
        types: typesMap.get(item.id) ?? [],
      }))

      return {
        items: responseItems,
        total: Number(countResult.count),
      }
    },
  )

  // GET /api/pokemon/:id — детальная карточка для модального окна
  app.get(
    '/pokemon/:id',
    {
      schema: {
        params: pokemonDetailParamsSchema,
        response: {
          200: pokemonDetailSchema,
          404: pokemonNotFoundResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const [pokemon] = await db
        .select({
          id: pokemonTable.id,
          name: pokemonTable.name,
          spriteUrl: pokemonTable.spriteUrl,
          color: pokemonTable.color,
          hp: pokemonTable.hp,
          attack: pokemonTable.attack,
          defense: pokemonTable.defense,
          specialAttack: pokemonTable.specialAttack,
          specialDefense: pokemonTable.specialDefense,
          baseExperience: pokemonTable.baseExperience,
          generationId: pokemonTable.generationId,
        })
        .from(pokemonTable)
        .where(eq(pokemonTable.id, id))

      if (!pokemon) {
        return reply.code(404).send({ message: `Pokemon ${id} not found` })
      }

      const [typeRows, abilityRows] = await Promise.all([
        db
          .select({
            name: typesTable.name,
            color: typesTable.color,
          })
          .from(pokemonTypesTable)
          .innerJoin(typesTable, eq(pokemonTypesTable.typeId, typesTable.id))
          .where(eq(pokemonTypesTable.pokemonId, id))
          .orderBy(pokemonTypesTable.slot),
        db
          .select({
            name: abilitiesTable.name,
            isHidden: pokemonAbilitiesTable.isHidden,
          })
          .from(pokemonAbilitiesTable)
          .innerJoin(
            abilitiesTable,
            eq(pokemonAbilitiesTable.abilityId, abilitiesTable.id),
          )
          .where(eq(pokemonAbilitiesTable.pokemonId, id))
          .orderBy(pokemonAbilitiesTable.slot),
      ])

      return {
        ...pokemon,
        types: typeRows,
        abilities: abilityRows,
      }
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
      const [typeList, [statsRange]] = await Promise.all([
        db
          .select({ id: typesTable.id, name: typesTable.name })
          .from(typesTable)
          .orderBy(typesTable.name),
        db
          .select({
            hpMin: sql<number>`min(hp)::int`,
            hpMax: sql<number>`max(hp)::int`,
            attackMin: sql<number>`min(attack)::int`,
            attackMax: sql<number>`max(attack)::int`,
            defenseMin: sql<number>`min(defense)::int`,
            defenseMax: sql<number>`max(defense)::int`,
            spAttackMin: sql<number>`min(special_attack)::int`,
            spAttackMax: sql<number>`max(special_attack)::int`,
            spDefenseMin: sql<number>`min(special_defense)::int`,
            spDefenseMax: sql<number>`max(special_defense)::int`,
            expMin: sql<number>`min(base_experience)::int`,
            expMax: sql<number>`max(base_experience)::int`,
          })
          .from(pokemonTable),
      ])

      return {
        types: typeList,
        hp: {
          min: statsRange.hpMin,
          max: statsRange.hpMax,
        },
        attack: {
          min: statsRange.attackMin,
          max: statsRange.attackMax,
        },
        defense: {
          min: statsRange.defenseMin,
          max: statsRange.defenseMax,
        },
        specialAttack: {
          min: statsRange.spAttackMin,
          max: statsRange.spAttackMax,
        },
        specialDefense: {
          min: statsRange.spDefenseMin,
          max: statsRange.spDefenseMax,
        },
        experience: {
          min: statsRange.expMin,
          max: statsRange.expMax,
        },
      }
    },
  )
}
