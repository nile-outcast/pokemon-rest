import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

const configDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(configDir, '../..')

loadEnv({ path: resolve(repoRoot, '.env') })

export default defineConfig({
  dialect: 'postgresql',
  schema: resolve(configDir, 'src/db/schema.ts'),
  out: resolve(configDir, 'src/db/migrations'),
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
