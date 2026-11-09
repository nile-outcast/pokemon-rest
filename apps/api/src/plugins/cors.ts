import fastifyCors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'

/**
 * CORS: в dev-режиме фронт на 5173 обращается к API на 3003.
 * В проде через Vite proxy CORS не нужен, но оставляем для гибкости.
 */
export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(fastifyCors, {
    origin: true,
  })
}
