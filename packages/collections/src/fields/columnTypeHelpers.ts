// Column type helpers - type-safe constructors for database column types

import type { ColumnType } from '../column-types'

/**
 * Creates a varchar column type
 */
export const varchar = (length: number): ColumnType => ({
  name: 'varchar',
  length,
})

/**
 * Creates a decimal column type
 */
export const decimal = (precision: number, scale: number): ColumnType => ({
  name: 'decimal',
  precision,
  scale,
})

/**
 * Creates an enum column type
 */
export const enumColumn = (values: string[]): ColumnType => ({
  name: 'enum',
  values,
})

/**
 * Creates a simple column type (no additional properties)
 */
export const simpleColumn = (name: 'boolean' | 'date' | 'timestamp' | 'timestamptz' | 'json' | 'jsonb' | 'uuid' | 'integer' | 'serial' | 'real' | 'text'): ColumnType => ({
  name,
})
