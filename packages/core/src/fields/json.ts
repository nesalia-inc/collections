import { fieldType, type FieldTypeInstance } from '../field-type'
import { z } from 'zod'

/**
 * JSON field type for storing JSON data
 */
export const json = (schema?: z.ZodType): FieldTypeInstance => {
  return fieldType({
    schema: schema ?? z.any(),
    database: { type: 'jsonb' }
  })()
}
