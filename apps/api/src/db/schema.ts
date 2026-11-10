import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Основная таблица покемонов */
export const pokemonTable = pgTable(
  'pokemon',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    hp: smallint('hp').notNull(),
    attack: smallint('attack').notNull(),
    defense: smallint('defense').notNull(),
    specialAttack: smallint('special_attack').notNull(),
    specialDefense: smallint('special_defense').notNull(),
    baseExperience: smallint('base_experience').notNull(),
    spriteUrl: text('sprite_url'),
    // Цвет вида — из pokemon-species.color (10 цветов вида)
    color: text('color').notNull(),
    // Поколение — id из pokemon-species.generation (1..9), фронт рендерит «Generation {id}»
    generationId: smallint('generation_id').notNull(),
  },
  (table) => [
    uniqueIndex('pokemon_name_unique').on(table.name),
    index('pokemon_attack_idx').on(table.attack),
    index('pokemon_experience_idx').on(table.baseExperience),
  ],
)

/** Справочник типов (electric, fire, ...) */
export const typesTable = pgTable(
  'types',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    color: text('color').notNull(),
  },
  (table) => [uniqueIndex('types_name_unique').on(table.name)],
)

/** Связь покемон-тип (slot определяет порядок на карточке) */
export const pokemonTypesTable = pgTable(
  'pokemon_types',
  {
    pokemonId: integer('pokemon_id')
      .references(() => pokemonTable.id)
      .notNull(),
    typeId: integer('type_id')
      .references(() => typesTable.id)
      .notNull(),
    slot: smallint('slot').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.pokemonId, table.slot] }),
    index('pokemon_types_type_id_idx').on(table.typeId),
  ],
)

/** Справочник способностей (overgrow, blaze, ...) */
export const abilitiesTable = pgTable(
  'abilities',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
  },
  (table) => [uniqueIndex('abilities_name_unique').on(table.name)],
)

/** Связь покемон-способность (slot определяет порядок в игре) */
export const pokemonAbilitiesTable = pgTable(
  'pokemon_abilities',
  {
    pokemonId: integer('pokemon_id')
      .references(() => pokemonTable.id)
      .notNull(),
    abilityId: integer('ability_id')
      .references(() => abilitiesTable.id)
      .notNull(),
    slot: smallint('slot').notNull(),
    isHidden: boolean('is_hidden').notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.pokemonId, table.slot] }),
    index('pokemon_abilities_ability_id_idx').on(table.abilityId),
  ],
)
