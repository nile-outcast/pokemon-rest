import type { Nullable } from 'typescript-extended-types'

/** Сырая запись из response.results эндпоинта /pokemon */
interface PokemonRaw {
  name: string
  url: string
}

/** Ответ от /pokemon */
export interface PokemonListResponse {
  count: number
  next: Nullable<string>
  previous: Nullable<string>
  results: Array<PokemonRaw>
}

/** Нормализованная запись покемона для использования в приложении */
export interface Pokemon {
  id: number
  name: string
}
