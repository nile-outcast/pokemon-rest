#!/usr/bin/env tsx
/**
 * Сидер для обкачки покемонов с PokeAPI.
 *
 * Запуск:
 *   npx tsx src/scripts/seed.ts                -- полная обкачка (~1350 записей)
 *   npx tsx src/scripts/seed.ts --limit=20     -- только первые 20
 *
 * Данные обрабатываются пачками по CHUNK_SIZE: пачка выгружается из PokeAPI
 * и сразу пишется в БД одной транзакцией, поэтому в памяти живёт только
 * текущая пачка ответов /pokemon (каждый ответ содержит полный список moves).
 *
 * Идемпотентность: ON CONFLICT UPDATE по id, pokemon_types и pokemon_abilities
 * перезаписываются полностью для id из текущей пачки.
 * Повторный запуск без --limit пересоберет все данные с PokeAPI.
 *
 * Формы с is_default: false (мега/гигамакс/регионалки) тоже сидятся:
 * список /pokemon в PokeAPI их содержит, и фронт показывает их наравне с
 * базовыми видами. Если нужны только базовые формы — фильтровать entries.
 *
 * Особенности данных: у части альтернативных форм (в текущем дампе 9,
 * например zygarde-mega) PokeAPI отдаёт пустой abilities — это данные API,
 * а не потеря сида. Типы stellar/unknown/shadow не назначены ни одному
 * покемону, поэтому в справочник типов они не попадают.
 */

import { inArray, sql } from 'drizzle-orm'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import { env } from '../config/env'
import {
  abilitiesTable,
  generationsTable,
  pokemonAbilitiesTable,
  pokemonTable,
  pokemonTypesTable,
  typesTable,
} from '../db/schema'

const { Pool } = pg

const CONCURRENCY = 8
const MAX_RETRIES = 3
/**
 * Явный таймаут запроса. Без него fetch полагается на дефолты undici
 * (~300 с), и одна зависшая запись означала бы ожидание до 3 попыток
 * по 5 минут вместо быстрого ретрая.
 */
const REQUEST_TIMEOUT_MS = 15_000
/** Размер пачки загрузки+записи: держим баланс между round-trip'ами к БД и памятью */
const CHUNK_SIZE = 200

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

interface PokeAbility {
  is_hidden: boolean
  slot: number
  ability: PokeEntry
}

interface PokeSpecies {
  id: number
  color: PokeEntry
  generation: PokeEntry
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
  abilities: Array<PokeAbility>
  sprites: PokeSprite
  species: PokeEntry
}

/**
 * Строки справочников и связей. Состав колонок выводим из схемы через
 * $inferInsert, чтобы не держать его в двух местах.
 */
type TypeRow = typeof typesTable.$inferInsert
type AbilityRow = typeof abilitiesTable.$inferInsert
type PokemonTypeLink = typeof pokemonTypesTable.$inferInsert
type PokemonAbilityLink = typeof pokemonAbilitiesTable.$inferInsert

// ── утилиты ─────────────────────────────────────────────────────

/** HTTP-ошибка с кодом ответа: по коду решаем, можно ли повторять запрос */
class HttpError extends Error {
  status: number

  constructor(status: number, statusText: string, url: string) {
    super(`${status} ${statusText} for ${url}`)
    this.name = 'HttpError'
    this.status = status
  }
}

/**
 * Повторять имеет смысл только временные сбои: 5xx, 429 (rate limit)
 * и сетевые ошибки/таймауты. 4xx — детерминированный ответ, ретрай
 * лишь сжигает время.
 */
function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) {
    return err.status >= 500 || err.status === 429
  }

  return true
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new HttpError(res.status, res.statusText, url)
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
      if (attempt === retries || !isRetryable(err)) throw err

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

  if (raw === undefined) return { limit: Infinity }

  if (raw.trim() === '') {
    throw new Error('Invalid --limit: empty value (expected integer >= 0)')
  }

  const limit = Number(raw)

  // Без проверки на целое и неотрицательное --limit=-5 через slice(0, -5)
  // молча отрежет последние 5 записей вместо ожидаемой ошибки
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new Error(`Invalid --limit: ${raw} (expected integer >= 0)`)
  }

  return { limit }
}

/** Извлекает id из URL вида https://pokeapi.co/api/v2/{path}/1/ */
function extractId(url: string, path: string): number {
  // завершающий слэш не обязателен: часть зеркал отдаёт URL без него
  const regexp = new RegExp(`/${path}/(\\d+)/?$`)
  const match = url.match(regexp)

  if (!match) {
    throw new Error(`Cannot extract ${path} id from url: ${url}`)
  }

  return Number(match[1])
}

/**
 * Значение базового стата по имени.
 * Отсутствующий стат — ошибка, а не 0: иначе переименование стата в
 * PokeAPI тихо испортит данные в БД.
 */
function statOf(detail: PokePokemon, name: string): number {
  const stat = detail.stats.find((s) => s.stat.name === name)

  if (!stat) {
    throw new Error(
      `Pokemon ${detail.name} (id ${detail.id}) has no "${name}" stat`,
    )
  }

  return stat.base_stat
}

/** Разбивает массив на пачки фиксированного размера */
function chunked<T>(items: Array<T>, size: number): Array<Array<T>> {
  const chunks: Array<Array<T>> = []

  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }

  return chunks
}

/**
 * Достаёт вид из кэша по id.
 * Промах означает ошибку сборки пачки (id не был загружен), а не отсутствие
 * данных в PokeAPI, поэтому это ошибка, а не null.
 */
function requireSpecies(
  cache: Map<number, PokeSpecies>,
  id: number,
): PokeSpecies {
  const species = cache.get(id)

  if (!species) {
    throw new Error(`Species ${id} is missing from cache`)
  }

  return species
}

// ── основной поток ────────────────────────────────────────────────

/**
 * Палитра типов — hex-цвета из официального гайда Bulbapedia.
 *
 * PokeAPI не отдаёт цвет типа, только имя, поэтому справочник держим
 * локально и записываем в колонку types.color при сиде.
 *
 * stellar/unknown/shadow ни один покемон текущего дампа не использует
 * (у terapagos-stellar в PokeAPI тип normal), но держим справочник
 * полным на все 21 тип: types.color — NOT NULL.
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
  stellar: '#00A39C',
  unknown: '#8B8B8B',
  shadow: '#4A4A4A',
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

/**
 * Цвет для имени, которого нет в палитре.
 *
 * types.color и pokemon.color — NOT NULL, поэтому undefined отдать нельзя.
 * Оттенок нейтральный и намеренно не совпадает ни с одним цветом палитры,
 * чтобы такие записи были отличимы в данных и на фронте.
 */
const FALLBACK_COLOR = '#9E9E9E'

const warnedColors = new Set<string>()

/**
 * Достаёт hex из палитры по имени, при пропуске пишет предупреждение
 * (один раз на имя) и отдаёт FALLBACK_COLOR.
 */
function colorOf(
  palette: Record<string, string>,
  name: string,
  kind: string,
): string {
  const color = palette[name]

  if (color === undefined) {
    const key = `${kind}:${name}`

    if (!warnedColors.has(key)) {
      warnedColors.add(key)
      process.stderr.write(
        `\n⚠ unknown ${kind} "${name}", using fallback ${FALLBACK_COLOR}\n`,
      )
    }

    return FALLBACK_COLOR
  }

  return color
}

/** Строка таблицы pokemon из деталей покемона и его вида */
function toPokemonRow(detail: PokePokemon, species: PokeSpecies) {
  return {
    id: detail.id,
    name: detail.name,
    // 5 базовых статов из 6: speed в схеме не хранится
    // отсутствующий стат — ошибка, а не 0
    hp: statOf(detail, 'hp'),
    attack: statOf(detail, 'attack'),
    defense: statOf(detail, 'defense'),
    specialAttack: statOf(detail, 'special-attack'),
    specialDefense: statOf(detail, 'special-defense'),
    baseExperience: detail.base_experience ?? 0,
    // Спрайт: официальный артворк, fallback на обычный спрайт
    spriteUrl:
      detail.sprites.other?.['official-artwork']?.front_default ??
      detail.sprites.front_default ??
      null,
    // Hex-значение цвета вида покемона
    color: colorOf(SPECIES_COLORS, species.color.name, 'species color'),
    // Номер поколения из pokemon-species.generation
    generationId: extractId(species.generation.url, 'generation'),
  }
}

/**
 * Обрабатывает одну пачку: выгружает детали и виды из PokeAPI, затем
 * одной транзакцией обновляет справочники, покемонов и связи.
 *
 * Порядок внутри транзакции важен: справочники types/abilities/generations
 * должны существовать до вставки связей, иначе FK не найдёт ссылку.
 */
async function processChunk(
  db: NodePgDatabase,
  entries: Array<PokeEntry>,
  speciesCache: Map<number, PokeSpecies>,
): Promise<number> {
  const base = env.POKEAPI_BASE_URL

  // 1. Детали покемонов пачки параллельно.
  // entry.url — абсолютная ссылка на свой хост, но склеиваем с base на
  // случай, если POKEAPI_BASE_URL указывает на зеркало или локальный прокси
  const details = await concurrentMap(
    entries,
    (entry) =>
      fetchWithRetry<PokePokemon>(
        `${base}/pokemon/${extractId(entry.url, 'pokemon')}`,
      ),
    CONCURRENCY,
  )

  // 2. Виды параллельно — для цвета вида и поколения.
  // Формы одного вида делят один species, поэтому грузим только id,
  // которых ещё нет в кэше (кэш живёт всю обкачку, см. main)
  const missingSpeciesIds = [
    ...new Set(
      details.map((detail) => extractId(detail.species.url, 'pokemon-species')),
    ),
  ].filter((id) => !speciesCache.has(id))

  const loadedSpecies = await concurrentMap(
    missingSpeciesIds,
    (id) => fetchWithRetry<PokeSpecies>(`${base}/pokemon-species/${id}`),
    CONCURRENCY,
  )

  for (const species of loadedSpecies) {
    speciesCache.set(species.id, species)
  }

  const rows = details.map((detail) => ({
    detail,
    species: requireSpecies(
      speciesCache,
      extractId(detail.species.url, 'pokemon-species'),
    ),
  }))

  // 3. Справочники и связи пачки собираем одним проходом: раньше types и
  // abilities вставлялись для каждого покемона отдельно (~1350 × 2
  // заведомо конфликтующих INSERT)
  const typeById = new Map<number, TypeRow>()
  const abilityById = new Map<number, AbilityRow>()
  const generationById = new Map<number, string>()
  const typeLinks: Array<PokemonTypeLink> = []
  const abilityLinks: Array<PokemonAbilityLink> = []

  for (const { detail, species } of rows) {
    for (const t of detail.types) {
      const typeId = extractId(t.type.url, 'type')

      typeById.set(typeId, {
        id: typeId,
        name: t.type.name,
        color: colorOf(TYPE_COLORS, t.type.name, 'type'),
      })
      typeLinks.push({ pokemonId: detail.id, typeId, slot: t.slot })
    }

    for (const a of detail.abilities) {
      const abilityId = extractId(a.ability.url, 'ability')

      abilityById.set(abilityId, { id: abilityId, name: a.ability.name })
      abilityLinks.push({
        pokemonId: detail.id,
        abilityId,
        slot: a.slot,
        isHidden: a.is_hidden,
      })
    }

    // Справочник поколений — id и name уже пришли в species,
    // отдельный запрос к /generation не нужен
    generationById.set(
      extractId(species.generation.url, 'generation'),
      species.generation.name,
    )
  }

  const pokemonIds = rows.map(({ detail }) => detail.id)

  // 4. Вся пачка — одна транзакция: при ошибке откатывается целиком,
  // в БД не остаётся покемон без связей
  await db.transaction(async (tx) => {
    // Upsert: при повторном запуске имя поколения перезаписывается из PokeAPI
    if (generationById.size > 0) {
      await tx
        .insert(generationsTable)
        .values(Array.from(generationById, ([id, name]) => ({ id, name })))
        .onConflictDoUpdate({
          target: generationsTable.id,
          set: { name: sql`excluded.name` },
        })
    }

    // Цвета типов берутся из палитры здесь же: раньше это было 18
    // отдельных UPDATE по имени (на пустой таблице — впустую)
    if (typeById.size > 0) {
      await tx
        .insert(typesTable)
        .values(Array.from(typeById.values()))
        .onConflictDoUpdate({
          target: typesTable.id,
          set: { name: sql`excluded.name`, color: sql`excluded.color` },
        })
    }

    if (abilityById.size > 0) {
      await tx
        .insert(abilitiesTable)
        .values(Array.from(abilityById.values()))
        .onConflictDoUpdate({
          target: abilitiesTable.id,
          set: { name: sql`excluded.name` },
        })
    }

    // Upsert покемонов пачки: при повторном запуске обновляем данные из PokeAPI
    await tx
      .insert(pokemonTable)
      .values(rows.map(({ detail, species }) => toPokemonRow(detail, species)))
      .onConflictDoUpdate({
        target: pokemonTable.id,
        set: {
          name: sql`excluded.name`,
          hp: sql`excluded.hp`,
          attack: sql`excluded.attack`,
          defense: sql`excluded.defense`,
          specialAttack: sql`excluded.special_attack`,
          specialDefense: sql`excluded.special_defense`,
          baseExperience: sql`excluded.base_experience`,
          spriteUrl: sql`excluded.sprite_url`,
          color: sql`excluded.color`,
          generationId: sql`excluded.generation_id`,
        },
      })

    // pokemon_types — полностью перезаписываем для id из пачки
    await tx
      .delete(pokemonTypesTable)
      .where(inArray(pokemonTypesTable.pokemonId, pokemonIds))

    if (typeLinks.length > 0) {
      await tx.insert(pokemonTypesTable).values(typeLinks)
    }

    // pokemon_abilities — полностью перезаписываем для id из пачки
    await tx
      .delete(pokemonAbilitiesTable)
      .where(inArray(pokemonAbilitiesTable.pokemonId, pokemonIds))

    if (abilityLinks.length > 0) {
      await tx.insert(pokemonAbilitiesTable).values(abilityLinks)
    }
  })

  return rows.length
}

async function main() {
  const { limit } = parseArgs()

  const pool = new Pool({ connectionString: env.DATABASE_URL })

  try {
    const db = drizzle(pool)

    // 1. Получить полный список покемонов
    const pokedex = await fetchWithRetry<{ results: Array<PokeEntry> }>(
      `${env.POKEAPI_BASE_URL}/pokemon?limit=100000`,
    )

    const entries =
      limit === Infinity ? pokedex.results : pokedex.results.slice(0, limit)
    process.stderr.write(`\n📦 found ${entries.length} pokemon\n`)

    // 2. Обкачка пачками. Кэш видов живёт всю обкачку: формы одного вида
    // могут попасть в разные пачки
    const speciesCache = new Map<number, PokeSpecies>()
    const chunks = chunked(entries, CHUNK_SIZE)

    for (const [index, chunk] of chunks.entries()) {
      const written = await processChunk(db, chunk, speciesCache)

      process.stderr.write(
        `\r  chunk ${index + 1}/${chunks.length} — ${written} pokemon`,
      )
    }

    // Итоговая статистика
    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pokemonTable)
    process.stderr.write(`\n\n✅ done — ${total?.count} pokemon in database\n`)
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  // process.exitCode вместо process.exit: даёт завершиться finally
  // (pool.end) и не обрывает вывод stderr
  process.exitCode = 1
})
