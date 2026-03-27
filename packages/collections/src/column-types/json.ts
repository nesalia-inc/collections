// JSON column types

import { type Success, ok } from '@deessejs/core'
import { ColumnType } from './types.js'

export const json = (): Success<ColumnType> => ok({ name: 'json' })
export const jsonb = (): Success<ColumnType> => ok({ name: 'jsonb' })
