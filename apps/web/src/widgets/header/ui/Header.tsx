import { Drawer } from '@base-ui/react/drawer'
import { useRef } from 'react'
import { NavLink } from 'react-router-dom'

import { routes } from '@/shared/config/routes'

import { HeaderNavList } from './HeaderNavList'

import './Header.css'

export function Header() {
  // ref для императивного закрытия drawer при клике на ссылку
  const drawerActionsRef = useRef<Drawer.Root.Actions>(null)
  // контейнер портала: передаём ref-объект, Base UI резолвит его сам
  const headerRef = useRef<HTMLElement>(null)

  const closeDrawer = () => drawerActionsRef.current?.close()

  return (
    <header className="header" ref={headerRef}>
      <div className="header__inner">
        <NavLink className="header__logo" to={routes.home}>
          Pokémon
        </NavLink>

        <HeaderNavList className="header__nav" />

        <Drawer.Root swipeDirection="up" actionsRef={drawerActionsRef}>
          <Drawer.Trigger className="header__burger" aria-label="Открыть меню">
            <span />
            <span />
            <span />
          </Drawer.Trigger>

          <Drawer.Portal container={headerRef}>
            <Drawer.Backdrop className="header__backdrop" />
            <Drawer.Viewport className="header__viewport">
              <Drawer.Popup className="header__drawer">
                <Drawer.Content className="header__drawer-content">
                  <HeaderNavList
                    className="header__drawer-nav"
                    onClick={closeDrawer}
                  />
                </Drawer.Content>
              </Drawer.Popup>
            </Drawer.Viewport>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </header>
  )
}
