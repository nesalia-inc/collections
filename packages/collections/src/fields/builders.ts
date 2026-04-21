// Field type builders - implementation using the new fieldType pattern

import { z } from 'zod'
import { fieldType } from './fieldType'
import type { FieldType, RelationOptions } from './types'
import { safeTransformArray } from './transform'
import {
  varchar,
  simpleColumn,
  decimal as decimalColumn,
  enumColumn,
} from './columnTypeHelpers'

/**
 * text - Text field type builder
 */
export const text = fieldType({
  type: 'text',
  schema: z.string(),
  options: {
    minLength: { schema: z.number().optional() },
    maxLength: { schema: z.number().optional() },
    pattern: { schema: z.string().optional() },
    coerce: { schema: z.boolean(), default: false },
    extend: { schema: z.function(), default: undefined },
  },
  applyOptions: (_schema, options) => {
    let result: z.ZodType<string> = options.coerce ? z.coerce.string() : z.string()

    if (options.minLength !== undefined) {
      result = (result as z.ZodString).min(options.minLength)
    }
    if (options.maxLength !== undefined) {
      result = (result as z.ZodString).max(options.maxLength)
    }
    if (options.pattern !== undefined) {
      try {
        result = (result as z.ZodString).regex(new RegExp(options.pattern))
      } catch {
        throw new Error(`Invalid regex pattern provided to f.text(): '${options.pattern}'`)
      }
    }
    if (options.extend) {
      result = (options.extend as (s: z.ZodString) => z.ZodType<string>)(result as z.ZodString)
    }

    return result
  },
  buildColumnType: (options) => varchar(options?.maxLength ?? 255),
})

/**
 * email - Email field type builder
 */
export const email = fieldType({
  type: 'email',
  schema: z.string().email(),
  buildColumnType: () => varchar(255),
  transform: (value: unknown) => {
    if (typeof value === 'string') {
      return value.toLowerCase().trim()
    }
    return String(value).toLowerCase().trim()
  },
})

/**
 * url - URL field type builder
 */
export const url = fieldType({
  type: 'url',
  schema: z.string().url(),
  buildColumnType: () => varchar(500),
  transform: (value: unknown) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return String(value).trim()
  },
})

/**
 * number - Number field type builder
 */
export const number = fieldType({
  type: 'number',
  schema: z.number(),
  options: {
    min: { schema: z.number().optional() },
    max: { schema: z.number().optional() },
    coerce: { schema: z.boolean(), default: false },
    extend: { schema: z.function(), default: undefined },
  },
  applyOptions: (_schema, options) => {
    let result: z.ZodType<number> = options.coerce ? z.coerce.number() : z.number()

    if (options.min !== undefined) {
      result = (result as z.ZodNumber).min(options.min)
    }
    if (options.max !== undefined) {
      result = (result as z.ZodNumber).max(options.max)
    }
    if (options.extend) {
      result = (options.extend as (s: z.ZodNumber) => z.ZodType<number>)(result as z.ZodNumber)
    }

    return result
  },
  buildColumnType: () => simpleColumn('integer'),
})

/**
 * decimal - Decimal field type builder
 */
export const decimal = (precision: number, scale: number): FieldType<number> =>
  fieldType({
    type: 'decimal',
    schema: z.number(),
    buildColumnType: () => decimalColumn(precision, scale),
  })({})

/**
 * boolean - Boolean field type builder
 */
export const boolean = fieldType({
  type: 'boolean',
  schema: z.boolean(),
  buildColumnType: () => simpleColumn('boolean'),
})

/**
 * date - Date field type builder
 */
export const date = fieldType({
  type: 'date',
  schema: z.date(),
  buildColumnType: () => simpleColumn('date'),
})

/**
 * timestamp - Timestamp field type builder
 */
export const timestamp = fieldType({
  type: 'timestamp',
  schema: z.date(),
  buildColumnType: () => simpleColumn('timestamp'),
})

/**
 * timestampTz - Timestamp with timezone field type builder
 */
export const timestampTz = fieldType({
  type: 'timestamptz',
  schema: z.date(),
  buildColumnType: () => simpleColumn('timestamptz'),
})

/**
 * json - JSON field type builder
 *
 * Accepts JSON objects and arrays.
 * Note: Top-level primitives (strings, numbers, booleans, null) are not
 * valid JSON objects - use z.record(z.string(), z.unknown()) for objects only.
 */
export const json = fieldType({
  type: 'json',
  schema: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]),
  buildColumnType: () => simpleColumn('json'),
})

/**
 * jsonb - JSONB field type builder
 *
 * Accepts JSON objects and arrays (binary JSON storage).
 */
export const jsonb = fieldType({
  type: 'jsonb',
  schema: z.union([z.record(z.string(), z.unknown()), z.array(z.unknown())]),
  buildColumnType: () => simpleColumn('jsonb'),
})

/**
 * uuid - UUID field type builder
 */
export const uuid = fieldType({
  type: 'uuid',
  schema: z.string().uuid(),
  buildColumnType: () => simpleColumn('uuid'),
})

/**
 * select - Select/enum field type builder
 */
export const select = <Values extends [string, ...string[]]>(values: Values) =>
  fieldType({
    type: 'select',
    schema: z.enum(values),
    buildColumnType: () => enumColumn([...values]),
  })({})

/**
 * relation - Relation field type builder
 *
 * Creates a UUID field that references another collection's primary key.
 * The actual relation semantics (belongs-to, has-many, many-to-many) are
 * determined at the collection level, not at the field level.
 *
 * @example
 * ```typescript
 * const posts = collection({
 *   slug: 'posts',
 *   fields: {
 *     author: field({ fieldType: f.relation() })
 *   }
 * })
 * ```
 *
 * @example
 * ```typescript
 * // hasMany creates a junction table
 * const posts = collection({
 *   slug: 'posts',
 *   fields: {
 *     tags: field({ fieldType: f.relation({ collection: 'tags', hasMany: true }) })
 *   }
 * })
 * ```
 */
export const relation = (
  options?: RelationOptions
): FieldType<string> => {
  const ft = fieldType({
    type: 'relation',
    schema: z.string().uuid(),
    buildColumnType: () => simpleColumn('uuid'),
  })({})

  return Object.freeze({
    ...ft,
    relationOptions: options ? Object.freeze(options) : undefined,
  })
}

/**
 * array - Array field type builder
 */
export const array = <T>(itemType: FieldType<T>): FieldType<T[]> =>
  fieldType({
    type: 'array',
    schema: z.array(itemType.schema),
    buildColumnType: () => simpleColumn('json'),
    transform: (value: unknown) =>
      safeTransformArray(itemType.type, itemType.transform, value),
  })({})

/**
 * richtext - Rich text field type builder
 */
export const richtext = fieldType({
  type: 'richtext',
  schema: z.string(),
  buildColumnType: () => simpleColumn('text'),
})

/**
 * file - File field type builder
 */
export const file = fieldType({
  type: 'file',
  schema: z.string().optional(),
  buildColumnType: () => varchar(500),
})

/**
 * increment - Auto-incrementing integer field type builder
 *
 * Creates an integer field that auto-increments with each insert.
 * The database handles the auto-increment behavior.
 */
export const increment = fieldType({
  type: 'increment',
  schema: z.number().int(),
  buildColumnType: () => simpleColumn('serial'),
})
