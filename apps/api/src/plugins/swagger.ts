import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import type { FastifyInstance } from 'fastify'
import {
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'

/** Регистрирует OpenAPI-схему и Swagger UI на /docs */
export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Pokemon REST API',
        version: '0.1.0',
        description: 'REST API для списка покемонов с фильтрами',
      },
    },
    transform: jsonSchemaTransform,
  })

  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  })

  // Schema-валидатор должен быть доступен для всех маршрутов после swagger
  app.withTypeProvider<ZodTypeProvider>()
}
