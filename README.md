# Pokemon REST

Монорепо с REST API для покемонов и React-фронтендом. Данные обкачиваются с [PokeAPI](https://pokeapi.co/) и хранятся в собственной PostgreSQL — фронтенд работает без обращений к внешнему API.

## Структура

```
pokemon-rest/
├─ apps/
│  ├─ web/                # Vite + React + TypeScript + Zustand (FSD)
│  └─ api/                # Fastify 5 + Drizzle + PostgreSQL
├─ packages/shared/       # zod-контракты (общие для web и api)
├─ docker-compose.yml     # PostgreSQL 16
├─ package.json           # npm workspaces
└─ tsconfig.json          # корневой tsconfig (references)
```

## Запуск

### 1. База данных

```bash
docker compose up -d
```

PostgreSQL 16 запустится на порту `5432` с volume для данных.

### 2. Бэкенд

```bash
npm run dev:api
```

Fastify запустится на `127.0.0.1:3003`. Swagger UI доступен на `/docs`.

### 3. Обкачка данных

```bash
npm run seed --workspace @pokemon-rest/api -- --limit=20   # первые 20
npm run seed --workspace @pokemon-rest/api                 # все (~1350)
npm run seed                                               # все (~1350)
```

Сидер идемпотентен — повторный запуск без `--limit` пересоберёт данные из PokeAPI.

### 4. Фронтенд

```bash
npm run dev:web
```

Vite запустится на `localhost:5173`. Запросы к `/api/*` проксируются на API-сервер.

## Фильтры списка

| Параметр        | Описание                                 |
|-----------------|------------------------------------------|
| `search`        | подстрочный поиск по имени               |
| `type`          | фильтр по типу (electric, fire…)         |
| `attackMin`     | минимальная атака                        |
| `attackMax`     | максимальная атака                       |
| `experienceMin` | минимальный base_experience              |
| `experienceMax` | максимальный base_experience             |
| `offset`        | смещение пагинации (по умолч. 0)         |
| `limit`         | размер страницы (по умолч. 40, макс 100) |

Ответ включает `total` — общее количество записей для `hasMore` в пагинации.

## Эндпоинты

| Метод   | Путь                           | Описание              |
|---------|--------------------------------|-----------------------|
| `GET`   | `/health`                      | статус сервера        |
| `GET`   | `/api/pokemon`                 | список с фильтрами    |
| `GET`   | `/api/pokemon/filters`         | справочник для UI     |
| `GET`   | `/docs`                        | Swagger UI            |

## Стек

- **API:** Fastify 5, `fastify-type-provider-zod`, zod-схемы, `drizzle-orm` + `drizzle-kit`, `pg`
- **БД:** PostgreSQL 16, расширение `pg_trgm` (GIN-индекс по имени), индексы по attack, base_experience, type_id
- **Фронт:** Vite, React 19, Zustand, FSD-архитектура
- **Контракты:** `packages/shared` — zod-схемы, общие для обоих приложений

## Команды

| Команда                             | Описание                          |
|-------------------------------------|-----------------------------------|
| `npm run dev:web`                   | фронтенд                          |
| `npm run dev:api`                   | API-сервер                        |
| `npm run seed`                      | сидер                             |
| `npm run build`                     | сборка всех workspace             |
| `npm run lint` / `npm run lint:fix` | ESLint                            |
| `npm run ts-check`                  | `tsc -b --force`                  |
