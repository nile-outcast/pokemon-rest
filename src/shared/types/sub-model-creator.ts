import type { GetState, SetState } from '@/shared/types/zustand-actions'

/**
 * Ключи стора, по которым лежит значение, совместимое с под-моделью.
 */
export type SubModelPath<Store, SubModel> = {
  [Key in keyof Store]: NonNullable<Store[Key]> extends SubModel ? Key : never
}[keyof Store]

/**
 * Сигнатура фабрики вложенной под-модели для Zustand-стора.
 *
 * В отличие от `SliceCreator`, который типизирован по собственному срезу
 * и микшируется в стор плоским спредом, под-модель знает о целевом сторе
 * и занимает в нём собственную ключ-область (`path`).
 *
 * `Store` выводится из типов `set`/`get`, поэтому при вызове его указывать
 * не нужно: `path` передаётся отдельным аргументом, а не полем конфига.
 *
 * Использование:
 *   export const createLoadingStageModel: SubModelCreator<LoadingStage> =
 *     (set, get, path) => ({ ... })
 *   // в сторе:
 *   loadingStage: createLoadingStageModel(set, get, 'loadingStage'),
 */
export type SubModelCreator<SubModel, Config = undefined> = <Store>(
  set: SetState<Store>,
  get: GetState<Store>,
  path: SubModelPath<Store, SubModel>,
  config?: Config,
) => SubModel
