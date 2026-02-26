import { fieldType, type FieldTypeInstance } from '../field-type'
import { z } from 'zod'

/**
 * Creates a select field type (enum)
 */
export const select = <T extends readonly [string, ...string[]]>(
  options: T
): FieldTypeInstance => {
  return fieldType({
    schema: z.enum(options),
    database: { type: 'text' }
  })()
}

/**
 * @deprecated Use select instead
 */
export const enumField = select
