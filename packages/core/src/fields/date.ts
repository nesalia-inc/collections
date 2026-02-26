import { fieldType, type FieldTypeCreator } from '../field-type'
import { z } from 'zod'

/**
 * Date field type (date without time)
 */
export const date: FieldTypeCreator = fieldType({
  schema: z.date(),
  database: { type: 'date' }
})

/**
 * Timestamp field type (date with time)
 */
export const timestamp: FieldTypeCreator = fieldType({
  schema: z.date(),
  database: { type: 'timestamp' }
})
