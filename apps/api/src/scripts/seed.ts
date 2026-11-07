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
  stat: {
    name: string
  }
}

interface PokeType {
  slot: number
  type: PokeEntry
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

/** Извлекает id из URL вида https://pokeapi.co/api/v2/pokemon/1/ */
function extractPokemonId(url: string): number {
  const match = url.match(/\/pokemon\/(\d+)\/$/)

  if (!match) {
    throw new Error(`Cannot extract id from url: ${url}`)
  }

  return Number(match[1])
}

/** Извлекает id типа из URL вида https://pokeapi.co/api/v2/type/12/ */
function extractTypeId(url: string): number {
  const match = url.match(/\/type\/(\d+)\/$/)

  if (!match) {
    throw new Error(`Cannot extract type id from url: ${url}`)
  }

  return Number(match[1])
}

// ── основной поток ────────────────────────────────────────────────

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

  // 2. Загрузить детали параллельно
  const details = await concurrentMap(
    entries,
    async (entry) =>
      fetchWithRetry<PokePokemon>(
        // entry.url - абсолютные ссылки на свой хост.
        // Используем склейку на случай если POKEAPI_BASE будет указывать на зеркало или локальный прокси
        `${POKEAPI_BASE}/pokemon/${extractPokemonId(entry.url)}`,
      ),
    CONCURRENCY,
  )

  // 3. Записать в БД
  for (const detail of details) {
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

    // Справочник типов неизменяем: существующие записи не трогаем
    await db
      .insert(typesTable)
      .values(
        detail.types.map((t) => ({
          id: extractTypeId(t.type.url),
          name: t.type.name,
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
      })
      .onConflictDoUpdate({
        target: pokemonTable.id,
        set: {
          name: detail.name,
          attack,
          defense,
          baseExperience: detail.base_experience ?? 0,
          spriteUrl,
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
          typeId: extractTypeId(t.type.url),
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
