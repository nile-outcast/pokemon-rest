import { buildApp } from './app'
import { env } from './config/env'

const app = await buildApp()

app.listen({ host: env.HOST, port: env.PORT }).catch((error: unknown) => {
  app.log.error(error)
  process.exit(1)
})
