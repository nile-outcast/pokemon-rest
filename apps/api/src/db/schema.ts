import {
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Основная таблица покемонов */
export const pokemon = pgTable(
  'pokemon',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    attack: smallint('attack').notNull(),
    defense: smallint('defense').notNull(),
    baseExperience: smallint('base_experience').notNull(),
    spriteUrl: text('sprite_url'),
  },
  (table) => [
    uniqueIndex('pokemon_name_unique').on(table.name),
    index('pokemon_attack_idx').on(table.attack),
    index('pokemon_experience_idx').on(table.baseExperience),
  ],
)

/** Справочник типов (electric, fire, ...) */
export const types = pgTable(
  'types',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
  },
  (table) => [uniqueIndex('types_name_unique').on(table.name)],
)

/** Связь покемон-тип (slot определяет порядок на карточке) */
export const pokemonTypes = pgTable(
  'pokemon_types',
  {
    pokemonId: integer('pokemon_id')
      .references(() => pokemon.id)
      .notNull(),
    typeId: integer('type_id')
      .references(() => types.id)
      .notNull(),
    slot: smallint('slot').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.pokemonId, table.slot] }),
    index('pokemon_types_type_id_idx').on(table.typeId),
  ],
)
