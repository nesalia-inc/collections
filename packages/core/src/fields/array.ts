import { fieldType, type FieldTypeCreator } from '../field-type'
import { z } from 'zod'

/**
 * Array field type for storing lists
 */
export const array = (itemSchema: z.ZodType): FieldTypeCreator => {
  return fieldType({
    schema: z.array(itemSchema),
    database: { type: 'array', itemType: 'text' }
  })
}
