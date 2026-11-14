import type { ChangeEvent, KeyboardEvent } from 'react'

import { usePokemonStore } from '@/entities/pokemon/model/pokemon-store'

import './PokemonSearch.css'

/**
 * Разрешены буквы любых алфавитов, цифры, пробел, дефис и апостроф.
 * Имена покемонов: porygon, mr-mime, porygon2, n'. Остальное вырезается.
 */
const FORBIDDEN_INPUT_RE = /[^\p{L}\p{N}\s'-]/gu

export function PokemonSearch() {
  const search = usePokemonStore((state) => state.search.value)
  const setSearch = usePokemonStore((state) => state.search.setValue)
  const debouncedFetchList = usePokemonStore(
    (state) => state.debouncedFetchPokemonList,
  )

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(FORBIDDEN_INPUT_RE, '')

    // Значение не изменилось после санитайзера — лишний запрос не нужен
    if (value === search) {
      return
    }

    setSearch(value)
    debouncedFetchList()
  }

  // По Enter — сбрасываем debounce и выполняем запрос немедленно
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      debouncedFetchList.flush()
    }
  }

  return (
    <input
      type="search"
      className="pokemon-search__input"
      placeholder="Поиск покемонов…"
      value={search}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  )
}
