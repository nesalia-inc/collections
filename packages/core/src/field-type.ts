import { z } from 'zod'

/**
 * A field type instance (already configured)
 */
export interface FieldTypeInstance {
  schema: z.ZodType
  database: unknown
}

/**
 * A field type creator (needs to be called to get instance)
 */
export type FieldTypeCreator = () => FieldTypeInstance

/**
 * Creates a new field type
 *
 * @example
 * const text = fieldType({
 *   schema: z.string(),
 *   database: { type: 'text' }
 * })
 *
 * const textField = text() // Get instance
 */
export function fieldType(
  config: {
    schema: z.ZodType
    database?: unknown
  }
): () => FieldTypeInstance {
  return () => ({
    schema: config.schema,
    database: config.database ?? {}
  })
}
