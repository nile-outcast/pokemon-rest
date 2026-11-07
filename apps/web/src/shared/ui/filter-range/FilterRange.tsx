import type { NumberRange } from '@pokemon-rest/shared'
import type { ChangeEvent } from 'react'
import { useId, useState } from 'react'
import { isDefined, isNullish } from 'typescript-extended-types'
import z from 'zod'

import type { RangeValue } from '@/shared/types/values'

import './FilterRange.css'

interface FilterRangeProps {
  /** Применённое значение — живёт у родителя, чтобы не теряться при закрытии */
  value: RangeValue
  /** Границы справочника: клампим ввод, чтобы не уходить за реальные данные */
  range: NumberRange
  onChange: (value: RangeValue) => void
  /** Закрытие дропдауна после применения */
  onClose: () => void
  /** Доп. действие после успешного применения, например вызов API */
  onApply?: () => void
}

function clamp(value: number, range: NumberRange): number {
  return Math.min(Math.max(value, range.min), range.max)
}

/**
 * Черновик числа из текстового поля.
 *
 * Пустое поле и мусор (`''`, `abc`) дают `null` — фильтр считается
 * снятым, а не «ноль». Значит `null` здесь — успешный результат, а не
 * ошибка валидации, и отвечает за него `.catch`, а не `.nullable`.
 *
 * `NaN` отсекает `z.number()` внутри `.pipe`, границы справочника —
 * последний `.transform`: наружу схема отдаёт либо `null`, либо число
 * уже внутри `range`.
 */
function createDraftSchema(range: NumberRange) {
  return z
    .string()
    .trim()
    .transform((raw) => (raw === '' ? null : Math.round(Number(raw))))
    .pipe(z.number().int().nullable())
    .catch(null)
    .transform((value) => (isNullish(value) ? null : clamp(value, range)))
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
  onClose,
  onApply,
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

  const handleMinChange = (event: ChangeEvent<HTMLInputElement>) =>
    setDraftMin(event.target.value)

  const handleMaxChange = (event: ChangeEvent<HTMLInputElement>) =>
    setDraftMax(event.target.value)

  const handleApply = () => {
    const draftSchema = createDraftSchema(range)
    const parsedMin = draftSchema.parse(draftMin)
    const parsedMax = draftSchema.parse(draftMax)

    // Оба значения есть и порядок перепутан — меняем местами вместо отказа:
    // пользователь видит результат своего ввода, а не молча сброшенный
    const isReversed =
      isDefined(parsedMin) && isDefined(parsedMax) && parsedMin > parsedMax

    onChange(
      isReversed
        ? { min: clamp(parsedMax, range), max: clamp(parsedMin, range) }
        : {
            min: isNullish(parsedMin) ? null : clamp(parsedMin, range),
            max: isNullish(parsedMax) ? null : clamp(parsedMax, range),
          },
    )

    onApply?.()
    onClose()
  }

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
