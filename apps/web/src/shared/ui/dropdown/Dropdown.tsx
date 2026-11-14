import { Popover } from '@base-ui/react/popover'
import type { CSSProperties, ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { isNullish } from 'typescript-extended-types'

import './Dropdown.css'

interface DropdownProps {
  /** Название фильтра — единственное, что видно в закрытом состоянии */
  label: string
  /**
   * Содержимое выпадающей панели.
   *
   * Функция получает колбэк `close`, чтобы вложенный контент мог закрыть
   * дропдаун сам — например кнопка «Применить» в диапазоне.
   */
  children: (close: () => void) => ReactNode
  /**
   * Перенос фокуса внутрь панели при открытии.
   *
   * Для списка опций фокус нужен — стрелки сразу листают варианты.
   * Для диапазона с инпутами фокус оставляем на триггере: случайная
   * цифра с клавиатуры не должна менять фильтр.
   */
  autoFocusContent?: boolean
  /** Ширина панели; без значения панель наследует ширину триггера */
  contentWidth?: number
}

/**
 * Дропдаун фильтра: кнопка-триггер с названием и панель с произвольным
 * содержимым. Закрывается по клику вне и по Escape — это поведение Radix.
 *
 * Состояние открыто контролируется, чтобы контент получал колбэк закрытия
 * без прямой зависимости от Radix.
 */
export function Dropdown({
  label,
  children,
  autoFocusContent = false,
  contentWidth,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const close = useCallback(() => setIsOpen(false), [])

  const popupStyle: CSSProperties | undefined = isNullish(contentWidth)
    ? undefined
    : { width: `${contentWidth}px` }

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger className="dropdown__button">
        <span className="dropdown__label">{label}</span>
        <span className="dropdown__arrow" aria-hidden="true" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner align="start" sideOffset={6} collisionPadding={12}>
          <Popover.Popup
            className="dropdown__content"
            style={popupStyle}
            // false — фокус остаётся на триггере; true — дефолтное поведение Base UI
            initialFocus={autoFocusContent}
          >
            {children(close)}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
