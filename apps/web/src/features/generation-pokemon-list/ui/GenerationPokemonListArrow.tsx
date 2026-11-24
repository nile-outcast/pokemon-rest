import { memo } from 'react'

import './GenerationPokemonListArrow.css'

type GenerationPokemonListArrowProps = {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: VoidFunction
}

/**
 * Кнопка-шеврон для переключения покемонов.
 *
 * Позиционируется flex-соседом списка по краям: `prev` слева, `next` справа.
 * Заблокирована, когда переключение невозможно (первый/последний покемон).
 *
 * Шеврон нарисован на CSS-границах — тот же приём, что в `.dropdown__arrow`.
 */
export const GenerationPokemonListArrow = memo(
  ({ direction, disabled, onClick }: GenerationPokemonListArrowProps) => {
    const isPrev = direction === 'prev'
    const label = isPrev ? 'Предыдущий покемон' : 'Следующий покемон'

    return (
      <button
        type="button"
        className={`generation-pokemon-list-arrow generation-pokemon-list-arrow--${direction}`}
        disabled={disabled}
        onClick={onClick}
        aria-label={label}
      >
        <span className="generation-pokemon-list-arrow__chevron" />
      </button>
    )
  },
)
