// Numeric column types

import { type Success, ok, type Result, err } from '@deessejs/core'
import { ColumnType } from './types'
import { ExtractError } from '@deessejs/core'
import { InvalidPrecisionScaleError } from './errors'
import { isValidPrecisionScale } from './validation'

// No-validation functions
export const serial = (): Success<ColumnType> => ok({ name: 'serial' })
export const integer = (): Success<ColumnType> => ok({ name: 'integer' })
export const real = (): Success<ColumnType> => ok({ name: 'real' })

// Validation functions
export const numeric = (precision: number, scale: number): Result<ColumnType, ExtractError<typeof InvalidPrecisionScaleError>> => {
  if (!isValidPrecisionScale(precision, scale)) {
    return err(InvalidPrecisionScaleError({ precision, scale }))
  }
  return ok({ name: 'numeric', precision, scale })
}

export const decimal = (precision: number, scale: number): Result<ColumnType, ExtractError<typeof InvalidPrecisionScaleError>> => {
  if (!isValidPrecisionScale(precision, scale)) {
    return err(InvalidPrecisionScaleError({ precision, scale }))
  }
  return ok({ name: 'decimal', precision, scale })
}
