// Date/Time column types

import { type Success, ok } from '@deessejs/core'
import { ColumnType } from './types.js'

export const date = (): Success<ColumnType> => ok({ name: 'date' })
export const timestamp = (): Success<ColumnType> => ok({ name: 'timestamp' })
export const timestamptz = (): Success<ColumnType> => ok({ name: 'timestamptz' })
