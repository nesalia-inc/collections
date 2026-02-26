import { fieldType, type FieldTypeInstance } from '../field-type'
import { z } from 'zod'

/**
 * Array field type for storing lists
 */
export const array = (itemSchema: z.ZodType): FieldTypeInstance => {
  return fieldType({
    schema: z.array(itemSchema),
    database: { type: 'array', itemType: 'text' }
  })()
}
