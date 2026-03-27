// Column type definitions and error types

import { type ExtractError } from '@deessejs/core'
import { InvalidPrecisionScaleError, InvalidLengthError, InvalidEnumValuesError } from './errors'

// ColumnTypeError union - all possible errors from column type functions
export type ColumnTypeError =
  | ExtractError<typeof InvalidPrecisionScaleError>
  | ExtractError<typeof InvalidLengthError>
  | ExtractError<typeof InvalidEnumValuesError>

// Type guard to check if error is InvalidPrecisionScale
export const isInvalidPrecisionScaleError = (e: ColumnTypeError): boolean =>
  e.name === 'InvalidPrecisionScale'

// Type guard to check if error is InvalidLength
export const isInvalidLengthError = (e: ColumnTypeError): boolean =>
  e.name === 'InvalidLength'

// Type guard to check if error is InvalidEnumValues
export const isInvalidEnumValuesError = (e: ColumnTypeError): boolean =>
  e.name === 'InvalidEnumValues'

// ColumnType discriminated union
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
