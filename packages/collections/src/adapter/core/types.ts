/**
 * Adapter Core Types
 *
 * These types define the dialect-agnostic intermediate representation (IR)
 * for database schema definitions. They are the bridge between:
 *   Collection Definition (High-Level)
 *         ↓
 *   RawTable/RawColumn (Mid-Level IR - Dialect Agnostic)
 *         ↓
 *   Drizzle Schema (Low-Level - Dialect Specific)
 */

/**
 * ReferenceAction - Foreign key referential actions
 * Supported by PostgreSQL and SQLite (with limitations)
 */
export type ReferenceAction = 'cascade' | 'set null' | 'set default' | 'restrict' | 'no action'

/**
 * BaseColumn - Shared properties for all column types
 */
export interface BaseColumn {
  /** Database column name (snake_case) */
  readonly name: string
  /** NOT NULL constraint */
  readonly notNull?: boolean
  /** Primary key constraint */
  readonly primaryKey?: boolean
  /** Default value */
  readonly default?: unknown
  /** Foreign key reference */
  readonly reference?: Readonly<{
    /** Column name in foreign table */
    readonly name: string
    /** Foreign table name */
    readonly table: string
    readonly onDelete?: ReferenceAction
    readonly onUpdate?: ReferenceAction
  }>
}

/**
 * RawColumn - Abstract column definition (dialect-agnostic)
 *
 * Converted to actual Drizzle columns by dialect-specific buildDrizzleTable().
 *
 * @example
 * // Boolean column
 * { type: 'boolean', name: 'is_active' }
 *
 * @example
 * // UUID with auto-generation
 * { type: 'uuid', name: 'id', defaultRandom: true, primaryKey: true }
 *
 * @example
 * // Enum with custom name
 * { type: 'enum', name: 'status', enumName: 'post_status', options: ['draft', 'published'] }
 */
export type RawColumn =
  | ({ readonly type: 'boolean' } & BaseColumn)
  | ({ readonly type: 'serial'; readonly autoIncrement?: boolean } & BaseColumn)
  | ({ readonly type: 'integer'; readonly autoIncrement?: boolean } & BaseColumn)
  | ({ readonly type: 'numeric'; readonly precision: number; readonly scale: number } & BaseColumn)
  | ({ readonly type: 'decimal'; readonly precision: number; readonly scale: number } & BaseColumn)
  | ({ readonly type: 'real' } & BaseColumn)
  | ({ readonly type: 'text' } & BaseColumn)
  | ({ readonly type: 'varchar'; readonly length: number } & BaseColumn)
  | ({ readonly type: 'char'; readonly length: number } & BaseColumn)
  | ({ readonly type: 'date' } & BaseColumn)
  | ({ readonly type: 'timestamp'; readonly precision?: number; readonly withTimezone?: boolean; readonly defaultNow?: boolean } & BaseColumn)
  | ({ readonly type: 'timestamptz'; readonly precision?: number; readonly defaultNow?: boolean } & BaseColumn)
  | ({ readonly type: 'json' } & BaseColumn)
  | ({ readonly type: 'jsonb' } & BaseColumn)
  | ({ readonly type: 'uuid'; readonly defaultRandom?: boolean } & BaseColumn)
  | ({ readonly type: 'enum'; readonly enumName: string; readonly options: readonly string[] } & BaseColumn)
  // PostgreSQL-only types (will error at runtime on other dialects)
  | ({ readonly type: 'vector'; readonly dimensions?: number } & BaseColumn)
  | ({ readonly type: 'halfvec'; readonly dimensions?: number } & BaseColumn)
  | ({ readonly type: 'sparsevec'; readonly dimensions?: number } & BaseColumn)
  | ({ readonly type: 'bit'; readonly dimensions?: number } & BaseColumn)

/**
 * RawIndex - Abstract index definition
 */
export interface RawIndex {
  readonly name: string
  /** Field(s) to index */
  readonly on: string | readonly string[]
  readonly unique?: boolean
}

/**
 * RawForeignKey - Abstract foreign key definition
 */
export interface RawForeignKey {
  readonly name: string
  /** Local column names */
  readonly columns: readonly string[]
  /** Foreign references */
  readonly foreignColumns: ReadonlyArray<{ readonly name: string; readonly table: string }>
  readonly onDelete?: ReferenceAction
  readonly onUpdate?: ReferenceAction
}

/**
 * RawTable - Abstract table definition
 */
export interface RawTable {
  readonly name: string
  readonly columns: Readonly<Record<string, RawColumn>>
  readonly indexes?: Readonly<Record<string, RawIndex>>
  readonly foreignKeys?: Readonly<Record<string, RawForeignKey>>
}

/**
 * Helper type to extract the column type name from RawColumn
 */
export type RawColumnType = RawColumn['type']

/**
 * Helper type to check if a column type is PostgreSQL-only
 */
export type PostgreSQLOnlyColumnType = Extract<RawColumnType, 'vector' | 'halfvec' | 'sparsevec' | 'bit'>

/**
 * Helper type to get standard (non-PostgreSQL-only) column types
 */
export type StandardColumnType = Exclude<RawColumnType, PostgreSQLOnlyColumnType>
