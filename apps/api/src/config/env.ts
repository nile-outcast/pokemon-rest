import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

// .env лежит в корне монорепо: от src/config/env.ts вверх на 4 уровня
const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url))

loadEnv({ path: resolve(repoRoot, '.env') })

const envSchema = z.object({
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  POKEAPI_BASE_URL: z.url().default('https://pokeapi.co/api/v2'),
})

/**
 * Проверенное окружение сервера.
 * Падает на старте, если переменные не заданы, — вместо тихих undefined в рантайме.
 */
export const env = envSchema.parse(process.env)
