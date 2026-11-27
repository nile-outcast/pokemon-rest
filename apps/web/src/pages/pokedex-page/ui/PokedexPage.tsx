import { PokemonFilters } from '@/features/pokemon-filters'
import { PokemonSearch } from '@/features/pokemon-search'
import { PokemonList } from '@/widgets/pokemon-list'

import './PokedexPage.css'

export default function PokedexPage() {
  return (
    <section className="pokedex-page">
      <div className="pokedex-page__toolbar">
        <PokemonSearch />
        <PokemonFilters />
      </div>
      <PokemonList />
    </section>
  )
}
