// Column type helpers - type-safe constructors for database column types

import { type Success, ok } from '@deessejs/core'
import type { ColumnType } from '../column-types'

/**
 * Creates a varchar column type
 */
export const varchar = (length: number): Success<ColumnType> => ok({
  name: 'varchar',
  length,
})

/**
 * Creates a decimal column type
 */
export const decimal = (precision: number, scale: number): Success<ColumnType> => ok({
  name: 'decimal',
  precision,
  scale,
})

/**
 * Creates an enum column type
 */
export const enumColumn = (values: string[]): Success<ColumnType> => ok({
  name: 'enum',
  values,
})

/**
 * Creates a simple column type (no additional properties)
 */
export const simpleColumn = (name: 'boolean' | 'date' | 'timestamp' | 'timestamptz' | 'json' | 'jsonb' | 'uuid' | 'integer' | 'serial' | 'real' | 'text'): Success<ColumnType> => ok({
  name,
})
