import { fieldType, type FieldTypeInstance } from '../field-type'
import { z } from 'zod'

/**
 * Derive the database type string from a Zod schema
 */
const getItemType = (itemSchema: z.ZodType): string => {
  if (itemSchema instanceof z.ZodString) return 'text'
  if (itemSchema instanceof z.ZodNumber) return 'integer'
  if (itemSchema instanceof z.ZodBoolean) return 'boolean'
  if (itemSchema instanceof z.ZodDate) return 'timestamp'
  if (itemSchema instanceof z.ZodEnum) return 'text'
  if (itemSchema instanceof z.ZodArray) return 'array'
  if (itemSchema instanceof z.ZodObject) return 'jsonb'
  return 'text'
}

/**
 * Array field type for storing lists
 */
export const array = (itemSchema: z.ZodType): FieldTypeInstance => {
  return fieldType({
    schema: z.array(itemSchema),
    database: { type: 'array', itemType: getItemType(itemSchema) }
  })()
}
