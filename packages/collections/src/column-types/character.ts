// Character column types

import { type Success, ok, err, type Result } from '@deessejs/core'
import { ColumnType } from './types'
import { ExtractError } from '@deessejs/core'
import { InvalidLengthError } from './errors'
import { isValidLength } from './validation'

// No-validation functions
export const text = (): Success<ColumnType> => ok({ name: 'text' })

// Validation functions
export const varchar = (length: number): Result<ColumnType, ExtractError<typeof InvalidLengthError>> => {
  if (!isValidLength(length)) {
    return err(InvalidLengthError({ length }))
  }
  return ok({ name: 'varchar', length })
}

export const char = (length: number): Result<ColumnType, ExtractError<typeof InvalidLengthError>> => {
  if (!isValidLength(length)) {
    return err(InvalidLengthError({ length }))
  }
  return ok({ name: 'char', length })
}
