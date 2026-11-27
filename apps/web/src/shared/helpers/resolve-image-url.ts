import { type Nullable } from 'typescript-extended-types'

const DEFAULT_IMAGE_URL = '/pokeball.svg'

/**
 * URL картинки с заглушкой на случай, если ссылки нет.
 *
 * Заглушку можно переопределить — по умолчанию покебол.
 */
export const resolveImageUrl = (
  url: Nullable<string>,
  fallback: string = DEFAULT_IMAGE_URL,
): string => url || fallback
