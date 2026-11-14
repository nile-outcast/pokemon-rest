import Fastify, { type FastifyInstance } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

import { registerCors } from './plugins/cors'
import { registerSwagger } from './plugins/swagger'
import { healthRoute } from './routes/health'
import { pokemonRoute } from './routes/pokemon'

/**
 * Собирает настроенное приложение без запуска сервера.
 * Отдельно от server.ts, чтобы тесты могли гонять запросы через app.inject().
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true })

  // zod-валидация входящих запросов и сериализация ответов
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  // CORS и Swagger — общие плагины
  await registerCors(app)
  await registerSwagger(app)

  // Маршруты
  app.withTypeProvider<ZodTypeProvider>().register(healthRoute)
  app.withTypeProvider<ZodTypeProvider>().register(pokemonRoute, {
    prefix: '/api',
  })

  return app
}
