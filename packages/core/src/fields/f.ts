import { fieldType, type FieldTypeInstance } from '../field-type'
import { z } from 'zod'

/**
 * Text field type
 */
export const text = (): FieldTypeInstance => fieldType({
  schema: z.string(),
  database: { type: 'text' }
})()

/**
 * Email field type with built-in validation
 */
export const email = (): FieldTypeInstance => fieldType({
  schema: z.string().email(),
  database: { type: 'text' }
})()

/**
 * URL field type with built-in validation
 */
export const url = (): FieldTypeInstance => fieldType({
  schema: z.string().url(),
  database: { type: 'text' }
})()

/**
 * Number field type
 */
export const number = (): FieldTypeInstance => fieldType({
  schema: z.number(),
  database: { type: 'integer' }
})()

/**
 * Boolean field type
 */
export const boolean = (): FieldTypeInstance => fieldType({
  schema: z.boolean(),
  database: { type: 'boolean' }
})()

/**
 * Date field type (date only, no time)
 */
export const date = (): FieldTypeInstance => fieldType({
  schema: z.date(),
  database: { type: 'date' }
})()

/**
 * Timestamp field type (date with time)
 */
export const timestamp = (): FieldTypeInstance => fieldType({
  schema: z.date(),
  database: { type: 'timestamp' }
})()

/**
 * Creates a select field type
 */
export const select = <T extends readonly [string, ...string[]]>(
  options: T
): FieldTypeInstance => fieldType({
  schema: z.enum(options),
  database: { type: 'text' }
})()

/**
 * JSON field type for storing JSON data
 */
export const json = (schema?: z.ZodType): FieldTypeInstance => fieldType({
  schema: schema ?? z.any(),
  database: { type: 'jsonb' }
})()

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
export const array = (itemSchema: z.ZodType): FieldTypeInstance => fieldType({
  schema: z.array(itemSchema),
  database: { type: 'array', itemType: getItemType(itemSchema) }
})()

/**
 * Relation field type options
 */
export type RelationOptions = {
  collection: string
  singular?: boolean
  many?: boolean
  through?: string
}

/**
 * Creates a relation field type for foreign key relationships
 */
export const relation = (options: RelationOptions): FieldTypeInstance => {
  const isMany = options.many ?? false
  const isSingular = options.singular ?? false

  return fieldType({
    schema: isMany ? z.array(z.string()) : z.string(),
    database: {
      type: 'integer',
      references: options.collection,
      through: options.through,
      many: isMany,
      singular: isSingular
    }
  })()
}
