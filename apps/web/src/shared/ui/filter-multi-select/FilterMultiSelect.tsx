import type { BaseEntity } from '@pokemon-rest/shared'

import './FilterMultiSelect.css'

interface FilterMultiSelectProps {
  options: Array<BaseEntity>
  selected: Array<number>
  onChange: (id: number) => void
  /** Подпись группы для скринридеров */
  ariaLabel: string
}

/**
 * Выпадающий список с множественным выбором.
 *
 * Компонент контролируемый: Base UI размонтирует панель при закрытии, поэтому
 * выбор не может жить в его собственном state — иначе сбрасывался бы после
 * каждого закрытия и выглядел как одиночный выбор.
 */
export function FilterMultiSelect({
  options,
  selected,
  onChange,
  ariaLabel,
}: FilterMultiSelectProps) {
  return (
    <div className="filter-multi-select" role="group" aria-label={ariaLabel}>
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
              onClick={() => onChange(type.id)}
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
