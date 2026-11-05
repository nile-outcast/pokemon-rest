import { PokemonList } from '@/features/pokemon-list'
import { PokemonSearch } from '@/features/pokemon-search'
import './IndexPage.css'

export function IndexPage() {
  return (
    <section className="index-page">
      <div className="index-page__toolbar">
        <h1 className="index-page__header">Pokemon</h1>
        <PokemonSearch />
      </div>
      <PokemonList />
    </section>
  )
}
