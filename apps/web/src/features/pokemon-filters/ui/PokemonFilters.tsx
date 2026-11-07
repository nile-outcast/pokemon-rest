import { useEffect } from 'react'
import { useShallow } from 'zustand/shallow'

import { usePokemonStore } from '@/entities/pokemon/model/pokemon-store'
import { FILTER_LABEL } from '@/features/pokemon-filters/config/filter-presets'
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
  const { filtersCatalog, types, attack, experience } = usePokemonStore(
    useShallow((state) => ({
      filtersCatalog: state.filtersCatalog,
      types: state.types.value,
      attack: state.attack.value,
      experience: state.experience.value,
    })),
  )

  const setTypes = usePokemonStore((state) => state.types.setValue)

  const setAttack = usePokemonStore((state) => state.attack.setValue)

  const setExperience = usePokemonStore((state) => state.experience.setValue)

  const fetchFiltersCatalog = usePokemonStore(
    (state) => state.fetchFiltersCatalog,
  )
  const fetchPokemonList = usePokemonStore((state) => state.fetchPokemonList)
  const debouncedFetchList = usePokemonStore(
    (state) => state.debouncedFetchPokemonList,
  )

  useEffect(() => debouncedFetchList.cancel, [debouncedFetchList])

  useEffect(() => {
    void fetchFiltersCatalog()
  }, [fetchFiltersCatalog])

  const onChangeTypes = (id: number) => {
    setTypes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((type) => type !== id)
      }

      return [...prev, id]
    })

    void debouncedFetchList()
  }

  const onApplyRange = () => {
    debouncedFetchList.cancel()
    void fetchPokemonList()
  }

  return (
    <div className="pokemon-filters">
      <Dropdown label={FILTER_LABEL.type} autoFocusContent>
        {() => (
          <FilterMultiSelect
            options={filtersCatalog.types}
            selected={types}
            onChange={onChangeTypes}
          />
        )}
      </Dropdown>

      <Dropdown label={FILTER_LABEL.attack}>
        {(onClose) => (
          <FilterRange
            value={attack}
            range={filtersCatalog.attack}
            onChange={setAttack}
            onClose={onClose}
            onApply={onApplyRange}
          />
        )}
      </Dropdown>

      <Dropdown label={FILTER_LABEL.experience}>
        {(onClose) => (
          <FilterRange
            value={experience}
            range={filtersCatalog.experience}
            onChange={setExperience}
            onClose={onClose}
            onApply={onApplyRange}
          />
        )}
      </Dropdown>
    </div>
  )
}
