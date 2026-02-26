import { fieldType, type FieldTypeInstance } from '../field-type'
import { z } from 'zod'

/**
 * Creates an enum field type
 */
export const enumField = <T extends readonly [string, ...string[]]>(
  options: T
): FieldTypeInstance => {
  return fieldType({
    schema: z.enum(options),
    database: { type: 'text' }
  })()
}
