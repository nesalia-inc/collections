import { fieldType, type FieldTypeCreator } from '../field-type'
import { z } from 'zod'

/**
 * Creates an enum field type
 */
export const enumField = <T extends readonly [string, ...string[]]>(
  options: T
): FieldTypeCreator => {
  return fieldType({
    schema: z.enum(options),
    database: { type: 'text' }
  })
}
