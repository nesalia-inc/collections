// Column Types
// Low-level functions that return column type objects used by database providers.

import { type Success, ok, err, type Result, type Error, error } from '@deessejs/core'
import { z } from 'zod'

// Error builders using @deessejs/core error system
const InvalidPrecisionScaleError = error({
  name: 'InvalidPrecisionScale',
  schema: z.object({
    precision: z.number(),
    scale: z.number(),
  }),
})

const InvalidLengthError = error({
  name: 'InvalidLength',
  schema: z.object({
    length: z.number(),
  }),
})

const InvalidEnumValuesError = error({
  name: 'InvalidEnumValues',
  schema: z.object({
    values: z.array(z.string()),
    reason: z.enum(['empty', 'duplicates']),
  }),
})

// Error argument types (exported for consumers)
export type InvalidPrecisionScaleErrorArgs = { precision: number; scale: number }
export type InvalidLengthErrorArgs = { length: number }
export type InvalidEnumValuesErrorArgs = { values: string[]; reason: 'empty' | 'duplicates' }

// ColumnTypeError union - all possible errors from column type functions
export type ColumnTypeError =
  | Error<InvalidPrecisionScaleErrorArgs>
  | Error<InvalidLengthErrorArgs>
  | Error<InvalidEnumValuesErrorArgs>

// Type guard to check if error is InvalidPrecisionScale
export const isInvalidPrecisionScaleError = (e: ColumnTypeError): boolean =>
  e.name === 'InvalidPrecisionScale'

// Type guard to check if error is InvalidLength
export const isInvalidLengthError = (e: ColumnTypeError): boolean =>
  e.name === 'InvalidLength'

// Type guard to check if error is InvalidEnumValues
export const isInvalidEnumValuesError = (e: ColumnTypeError): boolean =>
  e.name === 'InvalidEnumValues'

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

export const numeric = (precision: number, scale: number): Result<ColumnType, Error<InvalidPrecisionScaleErrorArgs>> => {
  if (precision < scale || precision < 1 || scale < 0) {
    return err(InvalidPrecisionScaleError({ precision, scale }).error)
  }
  return ok({ name: 'numeric', precision, scale })
}

export const decimal = (precision: number, scale: number): Result<ColumnType, Error<InvalidPrecisionScaleErrorArgs>> => {
  if (precision < scale || precision < 1 || scale < 0) {
    return err(InvalidPrecisionScaleError({ precision, scale }).error)
  }
  return ok({ name: 'decimal', precision, scale })
}

export const real = (): Success<ColumnType> => ok({ name: 'real' })

// Character types
export const text = (): Success<ColumnType> => ok({ name: 'text' })

export const varchar = (length: number): Result<ColumnType, Error<InvalidLengthErrorArgs>> => {
  if (length < 1) {
    return err(InvalidLengthError({ length }).error)
  }
  return ok({ name: 'varchar', length })
}

export const char = (length: number): Result<ColumnType, Error<InvalidLengthErrorArgs>> => {
  if (length < 1) {
    return err(InvalidLengthError({ length }).error)
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

export const enum_ = (values: string[]): Result<ColumnType, Error<InvalidEnumValuesErrorArgs>> => {
  if (!values || values.length === 0) {
    return err(InvalidEnumValuesError({ values, reason: 'empty' }).error)
  }
  const unique = new Set(values)
  if (unique.size !== values.length) {
    return err(InvalidEnumValuesError({ values, reason: 'duplicates' }).error)
  }
  return ok({ name: 'enum', values })
}
