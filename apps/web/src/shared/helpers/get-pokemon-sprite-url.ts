import { type Nullable } from 'typescript-extended-types'

const DEFAULT_URL = '/pokeball.svg'

export const getPokemonSpriteUrl = (spriteUrl: Nullable<string>): string =>
  spriteUrl || DEFAULT_URL
