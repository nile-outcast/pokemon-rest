import { useCallback, useEffect, useState } from 'react'

import { usePokemonStore } from '@/entities/pokemon/model/pokemon-store'
import { FILTER_LABEL } from '@/features/pokemon-filters/config/filter-presets'
import type { RangeValue } from '@/shared/types/values'
import { Dropdown } from '@/shared/ui/dropdown/Dropdown'
import { FilterMultiSelect } from '@/shared/ui/filter-multi-select/FilterMultiSelect'
import { FilterRange } from '@/shared/ui/filter-range/FilterRange'

import './PokemonFilters.css'

/**
 * Панель фильтров: три дропдауна в ряд (Тип, Атака, Опыт) под строкой
 * поиска.
 *
 * Значения живут здесь, а не внутри содержимого панелей: Radix
 * размонтирует панель при закрытии, и локальный state контента терялся бы
 * при каждом закрытии. Позже `useState` заменится на селекторы и экшены
 * стора, а разметка останется без изменений.
 */
export function PokemonFilters() {
  const filters = usePokemonStore((state) => state.filtersCatalog)
  const fetchFiltersCatalog = usePokemonStore(
    (state) => state.fetchFiltersCatalog,
  )

  useEffect(() => {
    void fetchFiltersCatalog()
  }, [fetchFiltersCatalog])

  const [selectedTypes, setSelectedTypes] = useState<Array<number>>([])
  const [attack, setAttack] = useState<RangeValue>({ min: null, max: null })
  const [experience, setExperience] = useState<RangeValue>({
    min: null,
    max: null,
  })

  const toggleType = useCallback((id: number) => {
    setSelectedTypes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((type) => type !== id)
      }

      return [...prev, id]
    })
  }, [])

  return (
    <div className="pokemon-filters">
      <Dropdown label={FILTER_LABEL.type} autoFocusContent>
        {() => (
          <FilterMultiSelect
            options={filters.types}
            selected={selectedTypes}
            onToggle={toggleType}
          />
        )}
      </Dropdown>

      <Dropdown label={FILTER_LABEL.attack}>
        {(close) => (
          <FilterRange
            value={attack}
            range={filters.attack}
            onChange={setAttack}
            close={close}
          />
        )}
      </Dropdown>

      <Dropdown label={FILTER_LABEL.experience}>
        {(close) => (
          <FilterRange
            value={experience}
            range={filters.experience}
            onChange={setExperience}
            close={close}
          />
        )}
      </Dropdown>
    </div>
  )
}
