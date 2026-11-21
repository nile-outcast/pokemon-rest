import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { Header } from '@/widgets/header'

// Ленивые импорты для code splitting
const HomePage = lazy(() => import('@/pages/home-page/ui/HomePage'))
const PokedexPage = lazy(() => import('@/pages/pokedex-page/ui/PokedexPage'))
const GenerationsPage = lazy(
  () => import('@/pages/generations-page/ui/GenerationsPage'),
)

const PageLoader = () => (
  <div
    style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    Загрузка страницы …
  </div>
)

export function App() {
  return (
    <BrowserRouter>
      <Header />
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path={routes.home} element={<HomePage />} />
            <Route path={routes.pokedex} element={<PokedexPage />} />
            <Route path={routes.generations} element={<GenerationsPage />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  )
}
