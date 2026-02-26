import { fieldType, type FieldTypeCreator } from '../field-type'
import { z } from 'zod'

/**
 * Number field type
 */
export const number: FieldTypeCreator = fieldType({
  schema: z.number(),
  database: { type: 'integer' }
})
