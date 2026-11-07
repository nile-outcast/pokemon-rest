import type { SetStateAction } from 'react'
import { isFunction } from 'typescript-extended-types'

import { setSubModel } from '../helpers/set-sub-model'
import type { SubModelCreator } from '../types/sub-model-creator'

type ValueModelConfig<Value = string> = {
  initialValue: Value
}

export interface ValueModel<Value = string> {
  value: Value
  setValue: (value: SetStateAction<Value>) => void
  resetValue: () => void
}

export const createValueModel =
  <Value = string>(): SubModelCreator<
    ValueModel<Value>,
    ValueModelConfig<Value>
  > =>
  (set, get, path, config): ValueModel<Value> => {
    const getValue = (): Value => {
      const model = get()[path] as ValueModel<Value>

      return model.value
    }

    const setValue = (value: SetStateAction<Value>) => {
      const prevValue = getValue()
      const nextValue = isFunction(value) ? value(prevValue) : value

      if (Object.is(prevValue, nextValue)) {
        return
      }

      setModel(nextValue)
    }

    const resetValue = () => setModel(config.initialValue)

    function setModel(data: Value) {
      setSubModel(set, path, makeModel(data))
    }

    function makeModel(value: Value): ValueModel<Value> {
      return {
        value,
        setValue,
        resetValue,
      }
    }

    return makeModel(config.initialValue)
  }
