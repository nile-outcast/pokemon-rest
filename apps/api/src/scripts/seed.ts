#!/usr/bin/env tsx
/**
 * Сидер для обкачки покемонов с PokeAPI.
 *
 * Запуск:
 *   npx tsx src/scripts/seed.ts                -- полная обкачка (~1300 покемонов)
 *   npx tsx src/scripts/seed.ts --limit=20     -- только первые 20
 *
 * Идемпотентность: ON CONFLICT UPDATE по id, pokemon_types заменяются полностью.
 * Повторный запуск без --limit пересоберет все данные с PokeAPI.
 */

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import { pokemonTable, pokemonTypesTable, typesTable } from '../db/schema'

const { Pool } = pg

// .env в корне монорепо: от scripts/seed.ts вверх на 4 уровня
const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url))
loadEnv({ path: resolve(repoRoot, '.env') })

const DB_URL = process.env.DATABASE_URL!
const POKEAPI_BASE = process.env.POKEAPI_BASE_URL ?? 'https://pokeapi.co/api/v2'
const CONCURRENCY = 8
const MAX_RETRIES = 3

// ── типы ответов PokeAPI ──────────────────────────────────────────

interface PokeEntry {
  name: string
  url: string
}

interface PokeStat {
  base_stat: number
  stat: PokeEntry
}

interface PokeType {
  slot: number
  type: PokeEntry
}

interface PokeSpecies {
  color: PokeEntry
}

interface PokeSprite {
  front_default: string | null
  other?: {
    'official-artwork'?: {
      front_default: string | null
    }
  }
}

interface PokePokemon {
  id: number
  name: string
  base_experience: number | null
  stats: Array<PokeStat>
  types: Array<PokeType>
  sprites: PokeSprite
  species: PokeEntry
}

// ── утилиты ─────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} for ${url}`)
  }

  return res.json() as Promise<T>
}

async function fetchWithRetry<T>(
  url: string,
  retries = MAX_RETRIES,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchJson<T>(url)
    } catch (err) {
      if (attempt === retries) throw err

      const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000)
      process.stderr.write(
        `\n⚠ retry ${attempt}/${retries} for ${url} in ${delay}ms`,
      )
      await new Promise((r) => setTimeout(r, delay))
    }
  }

  throw new Error('unreachable')
}

/**
 * Выполняет fn для каждого элемента с ограниченной конкурентностью.
 * Результат возвращается в том же порядке, что и вход.
 */
async function concurrentMap<T, R>(
  items: Array<T>,
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<Array<R>> {
  const results: Array<R> = []
  const iterator = items.entries()

  async function worker() {
    for (const [idx, item] of iterator) {
      results[idx] = await fn(item)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))

  return results
}

function parseArgs(): { limit: number } {
  const args = process.argv.slice(2)
  const raw = args
    .find((a) => a.startsWith('--limit='))
    ?.slice('--limit='.length)
  const limit = raw ? parseInt(raw, 10) : Infinity

  if (isNaN(limit)) throw new Error(`Invalid --limit: ${raw}`)

  return { limit }
}

/** Извлекает id из URL вида https://pokeapi.co/api/v2/{path}/1/ */
function extractId(url: string, path: string): number {
  const regexp = new RegExp(`/${path}/(\\d+)/$`)
  const match = url.match(regexp)

  if (!match) {
    throw new Error(`Cannot extract ${path} id from url: ${url}`)
  }

  return Number(match[1])
}

// ── основной поток ────────────────────────────────────────────────

/**
 * Палитра типов — hex-цвета из официального гайда Bulbapedia.
 *
 * PokeAPI не отдаёт цвет типа, только имя, поэтому справочник держим
 * локально и записываем в колонку types.color при сиде.
 */
const TYPE_COLORS: Record<string, string> = {
  normal: '#A8A77A',
  fire: '#EE8130',
  water: '#6390F0',
  electric: '#F7D02C',
  grass: '#7AC74C',
  ice: '#96D9D6',
  fighting: '#C22E28',
  poison: '#A33EA1',
  ground: '#E2BF65',
  flying: '#A98FF3',
  psychic: '#F95587',
  bug: '#A6B91A',
  rock: '#B6A136',
  ghost: '#735797',
  dragon: '#6F35FC',
  dark: '#705746',
  steel: '#B7B7CE',
  fairy: '#D685AA',
}

/**
 * Палитра видов — фон под артворком на карточке.
 *
 * PokeAPI отдаёт цвет вида только именем (10 вариантов), hex-значения
 * берём из палитры Veekun и мапим при сиде в pokemon.color.
 */
const SPECIES_COLORS: Record<string, string> = {
  black: '#464646',
  blue: '#6890F0',
  brown: '#AC6E4A',
  gray: '#989898',
  green: '#7AC74C',
  pink: '#F69CB4',
  purple: '#9568C8',
  red: '#EF3F37',
  white: '#F8F8F8',
  yellow: '#F8D030',
}

async function main() {
  const { limit } = parseArgs()

  const pool = new Pool({ connectionString: DB_URL })
  const db = drizzle(pool)

  // 1. Получить полный список покемонов
  const pokedex = await fetchWithRetry<{ results: Array<PokeEntry> }>(
    `${POKEAPI_BASE}/pokemon?limit=100000`,
  )

  const entries = pokedex.results.slice(
    0,
    limit === Infinity ? undefined : limit,
  )
  process.stderr.write(`\n📦 found ${entries.length} pokemon\n`)

  // 2. Загрузить деталки покемонов параллельно
  const detailList = await concurrentMap(
    entries,
    async (entry) =>
      fetchWithRetry<PokePokemon>(
        // entry.url - абсолютные ссылки на свой хост.
        // Используем склейку на случай если POKEAPI_BASE будет указывать на зеркало или локальный прокси
        `${POKEAPI_BASE}/pokemon/${extractId(entry.url, 'pokemon')}`,
      ),
    CONCURRENCY,
  )

  // 2b. Загрузить виды параллельно — для цвета вида
  const speciesList = await concurrentMap(
    detailList,
    async (entry) =>
      fetchWithRetry<PokeSpecies>(
        `${POKEAPI_BASE}/pokemon-species/${extractId(entry.species.url, 'pokemon-species')}`,
      ),
    CONCURRENCY,
  )

  // 3. Обновить цвета типов — полный справочник по имени
  const typeColorUpdates = Object.entries(TYPE_COLORS)

  if (typeColorUpdates.length > 0) {
    for (const [name, color] of typeColorUpdates) {
      await db
        .update(typesTable)
        .set({ color })
        .where(eq(typesTable.name, name))
    }
  }

  // 4. Записать в БД
  for (let i = 0; i < detailList.length; i++) {
    const detail = detailList[i]
    // Извлекаем атаку и защиту по именам статов
    const attack =
      detail.stats.find((s) => s.stat.name === 'attack')?.base_stat ?? 0
    const defense =
      detail.stats.find((s) => s.stat.name === 'defense')?.base_stat ?? 0
    // Спрайт: официальный артворк, fallback на обычный спрайт
    const spriteUrl =
      detail.sprites.other?.['official-artwork']?.front_default ??
      detail.sprites.front_default ??
      null

    const species = speciesList[i]
    // Hex-значение цвета вида покемона
    const color = SPECIES_COLORS[species.color.name]

    // Справочник типов неизменяем: существующие записи не трогаем
    await db
      .insert(typesTable)
      .values(
        detail.types.map((t) => ({
          id: extractId(t.type.url, 'type'),
          name: t.type.name,
          color: TYPE_COLORS[t.type.name],
        })),
      )
      .onConflictDoNothing()

    // Upsert покемона: при повторном запуске обновляем данные из PokeAPI
    await db
      .insert(pokemonTable)
      .values({
        id: detail.id,
        name: detail.name,
        attack,
        defense,
        baseExperience: detail.base_experience ?? 0,
        spriteUrl,
        color,
      })
      .onConflictDoUpdate({
        target: pokemonTable.id,
        set: {
          name: detail.name,
          attack,
          defense,
          baseExperience: detail.base_experience ?? 0,
          spriteUrl,
          color,
        },
      })

    // pokemon_types — полностью перезаписываем для этого покемона
    await db
      .delete(pokemonTypesTable)
      .where(eq(pokemonTypesTable.pokemonId, detail.id))

    if (detail.types.length > 0) {
      await db.insert(pokemonTypesTable).values(
        detail.types.map((t) => ({
          pokemonId: detail.id,
          typeId: extractId(t.type.url, 'type'),
          slot: t.slot,
        })),
      )
    }

    process.stderr.write(`\r  ${String(detail.id).padStart(4)} ${detail.name}`)
  }

  // Итоговая статистика
  const [total] = await db
    .select({ count: sql<number>`count(*)` })
    .from(pokemonTable)
  process.stderr.write(`\n\n✅ done — ${total.count} pokemon in database\n`)

  await pool.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
