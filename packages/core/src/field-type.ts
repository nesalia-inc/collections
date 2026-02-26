import { z } from 'zod'

/**
 * A field type instance (already configured)
 */
export type FieldTypeInstance = {
  schema: z.ZodType
  database: unknown
}

/**
 * A field type creator (needs to be called to get instance)
 */
export type FieldTypeCreator = () => FieldTypeInstance

/**
 * Field type configuration
 */
export type FieldTypeConfig = {
  schema: z.ZodType
  database?: unknown
}

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
export const fieldType = (config: FieldTypeConfig): (() => FieldTypeInstance) => {
  return () => ({
    schema: config.schema,
    database: config.database ?? {}
  })
}
