import { fieldType, type FieldTypeCreator } from '../field-type'
import { z } from 'zod'

/**
 * Text field type
 */
export const text: FieldTypeCreator = fieldType({
  schema: z.string(),
  database: { type: 'text' }
})

/**
 * Email field type with built-in validation
 */
export const email: FieldTypeCreator = fieldType({
  schema: z.string().email(),
  database: { type: 'text' }
})

/**
 * URL field type with built-in validation
 */
export const url: FieldTypeCreator = fieldType({
  schema: z.string().url(),
  database: { type: 'text' }
})
