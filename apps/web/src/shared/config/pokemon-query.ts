import type { PokemonListQuery } from '@pokemon-rest/shared'

export type PokemonFilters = Omit<PokemonListQuery, 'offset' | 'limit'>

type FilterKeys = keyof PokemonFilters

/**
 * Имена query-параметров списка покемонов.
 *
 * Единый источник правды для запроса к API и адресной строки. Имена
 * совпадают с контрактом `pokemonListQuerySchema` из `@pokemon-rest/shared`,
 * поэтому новый фильтр добавляется одной строкой здесь и дальше
 * переиспользуется и в параметрах запроса, и в URL.
 */
export const POKEMON_QUERY_PARAM: Record<FilterKeys, FilterKeys> = {
  search: 'search',
  type: 'type',
  attackMin: 'attackMin',
  attackMax: 'attackMax',
  experienceMin: 'experienceMin',
  experienceMax: 'experienceMax',
}
