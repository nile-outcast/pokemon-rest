import type { ChangeEvent, KeyboardEvent } from 'react'
import { useCallback, useEffect, useMemo } from 'react'

import { usePokemonStore } from '@/entities/pokemon/model/pokemon-store'
import { debounce } from '@/shared/helpers/debounce'

import './PokemonSearch.css'

const SEARCH_DEBOUNCE_MS = 300

/**
 * Разрешены буквы любых алфавитов, цифры, пробел, дефис и апостроф.
 * Имена покемонов: porygon, mr-mime, porygon2, n'. Остальное вырезается.
 */
const FORBIDDEN_INPUT_RE = /[^\p{L}\p{N}\s'-]/gu

export function PokemonSearch() {
  const search = usePokemonStore((state) => state.search)
  const setSearch = usePokemonStore((state) => state.setSearch)
  const fetchPokemonList = usePokemonStore((state) => state.fetchPokemonList)

  // debounce-обёртка: создаётся один раз за время жизни компонента
  const debouncedFetch = useMemo(
    () => debounce(() => void fetchPokemonList(), SEARCH_DEBOUNCE_MS),
    [fetchPokemonList],
  )

  // Отменяем отложенный вызов при размонтировании
  useEffect(() => debouncedFetch.cancel, [debouncedFetch])

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.replace(FORBIDDEN_INPUT_RE, '')

      // Значение не изменилось после санитайзера — лишний запрос не нужен
      if (value === search) {
        return
      }

      setSearch(value)
      debouncedFetch()
    },
    [search, setSearch, debouncedFetch],
  )

  // По Enter — сбрасываем debounce и выполняем запрос немедленно
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        debouncedFetch.flush()
      }
    },
    [debouncedFetch],
  )

  return (
    <div className="pokemon-search">
      <input
        type="search"
        className="pokemon-search__input"
        placeholder="Поиск покемонов…"
        value={search}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
