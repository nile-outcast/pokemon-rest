/**
 * Подписи статов для отображения.
 *
 * Ключи совпадают с полями контрактов `@pokemon-rest/shared`, чтобы
 * название не разъезжалось с данными. Полные — для полосок статов,
 * краткие — для узких мест (круглые значки).
 */
export const STAT_LABEL = {
  hp: 'Healthy Points',
  attack: 'Attack',
  defense: 'Defense',
  specialAttack: 'Special Attack',
  specialDefense: 'Special Defense',
  baseExperience: 'Base Experience',
} as const

/** Краткие подписи там, где полная не помещается */
export const STAT_LABEL_SHORT = {
  attack: 'Attack',
  defense: 'Defense',
  specialAttack: 'Sp Attack',
  specialDefense: 'Sp Defense',
} as const
