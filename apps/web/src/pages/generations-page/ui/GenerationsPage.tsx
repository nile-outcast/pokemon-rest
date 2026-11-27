import { useEffect } from 'react'

import { usePokemonStore } from '@/entities/pokemon'
import { GenerationList } from '@/widgets/generation-list'

import './GenerationsPage.css'

export default function GenerationsPage() {
  const fetchFiltersCatalog = usePokemonStore(
    (state) => state.fetchFiltersCatalog,
  )

  useEffect(() => {
    void fetchFiltersCatalog()
  }, [fetchFiltersCatalog])

  return (
    <section className="generations-page">
      <GenerationList />
    </section>
  )
}
