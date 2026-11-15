// Конфиг роутов: пути и заголовки навигации
export const routes = {
  home: '/',
  pokedex: '/pokedex',
  legendaries: '/legendaries',
} as const

// Union-тип путей
export type RouteKey = (typeof routes)[keyof typeof routes]

// Заголовки для навигации
export const navItems: Array<{ key: RouteKey; label: string }> = [
  { key: routes.home, label: 'Home' },
  { key: routes.pokedex, label: 'Pokédex' },
  { key: routes.legendaries, label: 'Legendaries' },
]
