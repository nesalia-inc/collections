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
 * Field types namespace (like zod's z)
 */
export const f = {
  /**
   * Text field type
   */
  text: (): FieldTypeInstance => fieldType({
    schema: z.string(),
    database: { type: 'text' }
  })(),

  /**
   * Email field type with built-in validation
   */
  email: (): FieldTypeInstance => fieldType({
    schema: z.string().email(),
    database: { type: 'text' }
  })(),

  /**
   * URL field type with built-in validation
   */
  url: (): FieldTypeInstance => fieldType({
    schema: z.string().url(),
    database: { type: 'text' }
  })(),

  /**
   * Number field type
   */
  number: (): FieldTypeInstance => fieldType({
    schema: z.number(),
    database: { type: 'integer' }
  })(),

  /**
   * Boolean field type
   */
  boolean: (): FieldTypeInstance => fieldType({
    schema: z.boolean(),
    database: { type: 'boolean' }
  })(),

  /**
   * Date field type (date only, no time)
   */
  date: (): FieldTypeInstance => fieldType({
    schema: z.date(),
    database: { type: 'date' }
  })(),

  /**
   * Timestamp field type (date with time)
   */
  timestamp: (): FieldTypeInstance => fieldType({
    schema: z.date(),
    database: { type: 'timestamp' }
  })(),

  /**
   * Creates a select field type
   */
  select: <T extends readonly [string, ...string[]]>(
    options: T
  ): FieldTypeInstance => fieldType({
    schema: z.enum(options),
    database: { type: 'text' }
  })(),

  /**
   * JSON field type for storing JSON data
   */
  json: (schema?: z.ZodType): FieldTypeInstance => fieldType({
    schema: schema ?? z.any(),
    database: { type: 'jsonb' }
  })(),

  /**
   * Array field type for storing lists
   */
  array: (itemSchema: z.ZodType): FieldTypeInstance => fieldType({
    schema: z.array(itemSchema),
    database: { type: 'array', itemType: getItemType(itemSchema) }
  })(),

  /**
   * Creates a relation field type for foreign key relationships
   */
  relation: (options: {
    collection: string
    singular?: boolean
    many?: boolean
    through?: string
  }): FieldTypeInstance => {
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
}

/**
 * @deprecated Use f.text() instead
 */
export const text = f.text

/**
 * @deprecated Use f.email() instead
 */
export const email = f.email

/**
 * @deprecated Use f.url() instead
 */
export const url = f.url

/**
 * @deprecated Use f.number() instead
 */
export const number = f.number

/**
 * @deprecated Use f.boolean() instead
 */
export const boolean = f.boolean

/**
 * @deprecated Use f.date() instead
 */
export const date = f.date

/**
 * @deprecated Use f.timestamp() instead
 */
export const timestamp = f.timestamp

/**
 * @deprecated Use f.select() instead
 */
export const select = f.select

/**
 * @deprecated Use f.json() instead
 */
export const json = f.json

/**
 * @deprecated Use f.array() instead
 */
export const array = f.array

/**
 * @deprecated Use f.relation() instead
 */
export const relation = f.relation

/**
 * @deprecated Use f.relation instead
 */
export type RelationOptions = {
  collection: string
  singular?: boolean
  many?: boolean
  through?: string
}
