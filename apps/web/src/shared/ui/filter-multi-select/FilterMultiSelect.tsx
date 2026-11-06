import type { PokemonOption } from '@pokemon-rest/shared'

import './FilterMultiSelect.css'

interface FilterMultiSelectProps {
  options: Array<PokemonOption>
  selected: Array<number>
  onToggle: (name: number) => void
}

/**
 * Выпадающий список с множественным выбором.
 *
 * Компонент контролируемый: Radix размонтирует панель при закрытии, поэтому
 * выбор не может жить в его собственном state — иначе сбрасывался бы после
 * каждого закрытия и выглядел как одиночный выбор.
 */
export function FilterMultiSelect({
  options,
  selected,
  onToggle,
}: FilterMultiSelectProps) {
  return (
    <div
      className="filter-multi-select"
      role="group"
      aria-label="Типы покемонов"
    >
      {options.map((type, index) => {
        const isSelected = selected.includes(type.id)

        return (
          <div key={type.id}>
            {/* Разделитель между опциями — из макета: горизонтальная линия */}
            {index > 0 && <hr className="filter-multi-select__separator" />}
            <button
              type="button"
              className={`filter-multi-select__option ${
                isSelected ? 'filter-multi-select__option--selected' : ''
              }`}
              onClick={() => onToggle(type.id)}
              aria-pressed={isSelected}
            >
              {/* Галочка делает множественный выбор видимым: у невыбранных
                  слот сохранён, поэтому имена выровнены по одной линии */}
              <span className="filter-multi-select__check" aria-hidden="true">
                {isSelected ? '✓' : ''}
              </span>
              <span className="filter-multi-select__name">{type.name}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
