import { fieldType, type FieldTypeInstance } from '../field-type'
import { z } from 'zod'

/**
 * Creates a select field type
 */
export const select = <T extends readonly [string, ...string[]]>(
  options: T
): FieldTypeInstance => {
  return fieldType({
    schema: z.enum(options),
    database: { type: 'text' }
  })()
}
