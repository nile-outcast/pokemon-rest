import type { NumberRange } from '@pokemon-rest/shared'
import type { ChangeEvent } from 'react'
import { useCallback, useId, useState } from 'react'
import type { Nullable } from 'typescript-extended-types'
import { isNullish } from 'typescript-extended-types'

import type { RangeValue } from '@/shared/types/values'

import './FilterRange.css'

interface FilterRangeProps {
  /** Применённое значение — живёт у родителя, чтобы не теряться при закрытии */
  value: RangeValue
  /** Границы справочника: клампим ввод, чтобы не уходить за реальные данные */
  range: NumberRange
  onChange: (value: RangeValue) => void
  /** Закрытие дропдауна после применения */
  close: () => void
}

/**
 * Черновик числа из текстового поля.
 *
 * Пустое поле и мусор (`''`, `abc`) дают `null` — фильтр считается
 * снятым, а не «ноль».
 */
function parseDraft(raw: string): Nullable<number> {
  const trimmed = raw.trim()

  if (trimmed === '') {
    return null
  }

  const parsed = Number(trimmed)

  if (Number.isNaN(parsed)) {
    return null
  }

  return Math.round(parsed)
}

function clamp(value: number, range: NumberRange): number {
  return Math.min(Math.max(value, range.min), range.max)
}

/**
 * Фильтр числового диапазона: поля «от» и «до» плюс кнопка «Применить».
 *
 * Ввод не трогает применённое значение — оно меняется только по кнопке,
 * которая заодно закрывает дропдаун. Radix размонтирует панель при
 * закрытии, поэтому черновик при каждом открытии стартует от
 * применённого значения.
 */
export function FilterRange({
  value,
  range,
  onChange,
  close,
}: FilterRangeProps) {
  // id полей нужны, чтобы подписи остались связаны с инпутами: разметка
  // на grid, и `label` больше не может быть внешним элементом для input
  const fieldId = useId()
  const minInputId = `${fieldId}-min`
  const maxInputId = `${fieldId}-max`

  const [draftMin, setDraftMin] = useState(
    isNullish(value.min) ? '' : String(value.min),
  )
  const [draftMax, setDraftMax] = useState(
    isNullish(value.max) ? '' : String(value.max),
  )

  const handleMinChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setDraftMin(event.target.value),
    [],
  )

  const handleMaxChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => setDraftMax(event.target.value),
    [],
  )

  const handleApply = useCallback(() => {
    const parsedMin = parseDraft(draftMin)
    const parsedMax = parseDraft(draftMax)

    // Оба значения есть и порядок перепутан — меняем местами вместо отказа:
    // пользователь видит результат своего ввода, а не молча сброшенный
    const isReversed =
      !isNullish(parsedMin) && !isNullish(parsedMax) && parsedMin > parsedMax

    onChange(
      isReversed
        ? { min: clamp(parsedMax, range), max: clamp(parsedMin, range) }
        : {
            min: isNullish(parsedMin) ? null : clamp(parsedMin, range),
            max: isNullish(parsedMax) ? null : clamp(parsedMax, range),
          },
    )

    close()
  }, [draftMin, draftMax, range, onChange, close])

  return (
    <div className="filter-range">
      {/*
        Grid с двумя рядами: подписи и инпуты. Разделитель попадает во
        второй ряд, поэтому `align-self: center` ставит его строго по
        центру инпутов, а не по центру строки вместе с подписью.
      */}
      <div className="filter-range__fields">
        <label
          className="filter-range__caption filter-range__caption--min"
          htmlFor={minInputId}
        >
          От
        </label>

        <label
          className="filter-range__caption filter-range__caption--max"
          htmlFor={maxInputId}
        >
          До
        </label>

        <input
          id={minInputId}
          type="number"
          inputMode="numeric"
          className="filter-range__input filter-range__input--min"
          value={draftMin}
          onChange={handleMinChange}
          placeholder={String(range.min)}
          min={range.min}
          max={range.max}
          step={1}
        />

        <span className="filter-range__divider" aria-hidden="true" />

        <input
          id={maxInputId}
          type="number"
          inputMode="numeric"
          className="filter-range__input filter-range__input--max"
          value={draftMax}
          onChange={handleMaxChange}
          placeholder={String(range.max)}
          min={range.min}
          max={range.max}
          step={1}
        />
      </div>

      <button
        type="button"
        className="filter-range__apply"
        onClick={handleApply}
      >
        Применить
      </button>
    </div>
  )
}
