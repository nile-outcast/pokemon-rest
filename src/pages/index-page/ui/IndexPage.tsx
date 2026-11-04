import { PokemonList } from '@/features/pokemon-list'
import './IndexPage.css'

export function IndexPage() {
  return (
    <section className="index-page">
      <h1 className="index-page__header">Pokemon</h1>
      <PokemonList />
    </section>
  )
}
