// Column Types
// Low-level functions that return column type objects used by database providers.

import { type Result, ok, err } from '@deessejs/core'

export type ColumnType =
  | { name: 'serial' }
  | { name: 'integer' }
  | { name: 'numeric'; precision: number; scale: number }
  | { name: 'decimal'; precision: number; scale: number }
  | { name: 'real' }
  | { name: 'text' }
  | { name: 'varchar'; length: number }
  | { name: 'char'; length: number }
  | { name: 'boolean' }
  | { name: 'date' }
  | { name: 'timestamp' }
  | { name: 'timestamptz' }
  | { name: 'json' }
  | { name: 'jsonb' }
  | { name: 'uuid' }
  | { name: 'enum'; values: string[] }

// Numeric types
export const serial = (): ColumnType => ({ name: 'serial' })
export const integer = (): ColumnType => ({ name: 'integer' })

export const numeric = (precision: number, scale: number): Result<ColumnType> => {
  if (precision < scale || precision < 1 || scale < 0) {
    return err(['Invalid precision/scale: precision must be >= scale and >= 1'] as const)
  }
  return ok({ name: 'numeric', precision, scale })
}

export const decimal = (precision: number, scale: number): Result<ColumnType> => {
  if (precision < scale || precision < 1 || scale < 0) {
    return err(['Invalid precision/scale: precision must be >= scale and >= 1'] as const)
  }
  return ok({ name: 'decimal', precision, scale })
}

export const real = (): ColumnType => ({ name: 'real' })

// Character types
export const text = (): ColumnType => ({ name: 'text' })

export const varchar = (length: number): Result<ColumnType> => {
  if (length < 1) {
    return err(['Invalid length: must be >= 1'] as const)
  }
  return ok({ name: 'varchar', length })
}

export const char = (length: number): Result<ColumnType> => {
  if (length < 1) {
    return err(['Invalid length: must be >= 1'] as const)
  }
  return ok({ name: 'char', length })
}

// Boolean
export const bool = (): ColumnType => ({ name: 'boolean' })

// Date/Time types
export const date = (): ColumnType => ({ name: 'date' })
export const timestamp = (): ColumnType => ({ name: 'timestamp' })
export const timestamptz = (): ColumnType => ({ name: 'timestamptz' })

// JSON types
export const json = (): ColumnType => ({ name: 'json' })
export const jsonb = (): ColumnType => ({ name: 'jsonb' })

// Other types
export const uuid = (): ColumnType => ({ name: 'uuid' })

export const enum_ = (values: string[]): Result<ColumnType> => {
  if (!values || values.length === 0) {
    return err(['Invalid values: array must not be empty'] as const)
  }
  const unique = new Set(values)
  if (unique.size !== values.length) {
    return err(['Invalid values: array must not contain duplicates'] as const)
  }
  return ok({ name: 'enum', values })
}
