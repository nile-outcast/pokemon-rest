import type { SubModelPath } from '@/shared/types/sub-model-creator'
import type { SetState } from '@/shared/types/zustand-actions'

/**
 * Записывает под-модель в стор по ключу `path`.
 *
 * Ограничение TS: объектный литерал с вычисляемым ключом union-типа
 * расширяется до индекс-сигнатуры, поэтому нужен каст к `Partial<Store>`.
 * Приведение локализовано здесь.
 */
export function setSubModel<Store, SubModel>(
  set: SetState<Store>,
  path: SubModelPath<Store, SubModel>,
  value: SubModel,
): void {
  set({ [path]: value } as Partial<Store>)
}
