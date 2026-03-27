// Other column types

import { type Success, ok, err, type Result } from '@deessejs/core'
import { ColumnType } from './types'
import { ExtractError } from '@deessejs/core'
import { InvalidEnumValuesError } from './errors'
import { isNonEmptyArray, hasNoDuplicates } from './validation'

export const uuid = (): Success<ColumnType> => ok({ name: 'uuid' })
export const bool = (): Success<ColumnType> => ok({ name: 'boolean' })

export const enum_ = (values: string[]): Result<ColumnType, ExtractError<typeof InvalidEnumValuesError>> => {
  if (!isNonEmptyArray(values)) {
    return err(InvalidEnumValuesError({ values, reason: 'empty' }))
  }
  if (!hasNoDuplicates(values)) {
    return err(InvalidEnumValuesError({ values, reason: 'duplicates' }))
  }
  return ok({ name: 'enum', values })
}
