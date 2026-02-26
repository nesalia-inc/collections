import { fieldType, type FieldTypeCreator } from '../field-type'
import { z } from 'zod'

/**
 * Boolean field type
 */
export const boolean: FieldTypeCreator = fieldType({
  schema: z.boolean(),
  database: { type: 'boolean' }
})
