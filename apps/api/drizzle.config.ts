import { resolve } from 'node:path'

import { config as loadEnv } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

loadEnv({ path: resolve('../../.env') })

export default defineConfig({
  dialect: 'postgresql',
  schema: 'src/db/schema.ts',
  out: 'src/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
