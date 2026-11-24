import { NavLink } from 'react-router-dom'

import { navItems } from '@/shared/config/routes'

type HeaderNavListProps = {
  className?: string
  onClick?: VoidFunction
}

/** Навигационный список для десктопного хедера и мобильного drawer */
export function HeaderNavList({ className, onClick }: HeaderNavListProps) {
  return (
    <nav className={className}>
      {navItems.map(({ key, label }) => (
        <NavLink
          key={key}
          className={({ isActive }) =>
            `header__link${isActive ? ' header__link--active' : ''}`
          }
          to={key}
          onClick={onClick}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
