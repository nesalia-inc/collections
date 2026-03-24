// Column Types
// Low-level functions that return column type objects used by database providers.

import { type Success, ok, err, type Result, type Error } from '@deessejs/core'

// Error types
export type InvalidPrecisionScaleErrorArgs = { precision: number; scale: number }
export type InvalidLengthErrorArgs = { length: number }
export type InvalidEnumValuesErrorArgs = { values: string[]; reason: 'empty' | 'duplicates' }

export type ColumnTypeError =
  | Error<InvalidPrecisionScaleErrorArgs>
  | Error<InvalidLengthErrorArgs>
  | Error<InvalidEnumValuesErrorArgs>

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
export const serial = (): Success<ColumnType> => ok({ name: 'serial' })
export const integer = (): Success<ColumnType> => ok({ name: 'integer' })

export const numeric = (precision: number, scale: number): Result<ColumnType, ColumnTypeError> => {
  if (precision < scale || precision < 1 || scale < 0) {
    return err({ name: 'InvalidPrecisionScale', args: { precision, scale }, notes: [], cause: null })
  }
  return ok({ name: 'numeric', precision, scale })
}

export const decimal = (precision: number, scale: number): Result<ColumnType, ColumnTypeError> => {
  if (precision < scale || precision < 1 || scale < 0) {
    return err({ name: 'InvalidPrecisionScale', args: { precision, scale }, notes: [], cause: null })
  }
  return ok({ name: 'decimal', precision, scale })
}

export const real = (): Success<ColumnType> => ok({ name: 'real' })

// Character types
export const text = (): Success<ColumnType> => ok({ name: 'text' })

export const varchar = (length: number): Result<ColumnType, ColumnTypeError> => {
  if (length < 1) {
    return err({ name: 'InvalidLength', args: { length }, notes: [], cause: null })
  }
  return ok({ name: 'varchar', length })
}

export const char = (length: number): Result<ColumnType, ColumnTypeError> => {
  if (length < 1) {
    return err({ name: 'InvalidLength', args: { length }, notes: [], cause: null })
  }
  return ok({ name: 'char', length })
}

// Boolean
export const bool = (): Success<ColumnType> => ok({ name: 'boolean' })

// Date/Time types
export const date = (): Success<ColumnType> => ok({ name: 'date' })
export const timestamp = (): Success<ColumnType> => ok({ name: 'timestamp' })
export const timestamptz = (): Success<ColumnType> => ok({ name: 'timestamptz' })

// JSON types
export const json = (): Success<ColumnType> => ok({ name: 'json' })
export const jsonb = (): Success<ColumnType> => ok({ name: 'jsonb' })

// Other types
export const uuid = (): Success<ColumnType> => ok({ name: 'uuid' })

export const enum_ = (values: string[]): Result<ColumnType, ColumnTypeError> => {
  if (!values || values.length === 0) {
    return err({ name: 'InvalidEnumValues', args: { values, reason: 'empty' }, notes: [], cause: null })
  }
  const unique = new Set(values)
  if (unique.size !== values.length) {
    return err({ name: 'InvalidEnumValues', args: { values, reason: 'duplicates' }, notes: [], cause: null })
  }
  return ok({ name: 'enum', values })
}
