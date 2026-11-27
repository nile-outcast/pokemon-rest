// Конфиг роутов: пути и заголовки навигации
export const routes = {
  home: '/',
  pokedex: '/pokedex',
  generations: '/generations',
} as const

// Union-тип путей
export type RouteKey = (typeof routes)[keyof typeof routes]

// Заголовки для навигации
export const navItems: Array<{ key: RouteKey; label: string }> = [
  { key: routes.home, label: 'Home' },
  { key: routes.pokedex, label: 'Pokédex' },
  { key: routes.generations, label: 'Generations' },
]
