// Predefined field types factory - provides common field types via the `f` object

import { z } from 'zod'
import { fieldType } from './fieldType'
import type { FieldType, TextFieldOptions, NumberFieldOptions } from './types'
import { safeTransformArray } from './transform'
import {
  varchar as createVarchar,
  simpleColumn as createSimpleColumn,
  decimal as createDecimalColumn,
  enumColumn as createEnumColumn,
} from './columnTypeHelpers'

/**
 * f - Predefined field types factory
 *
 * Provides common field types for building collections.
 *
 * @example
 * ```typescript
 * import { field, f } from '@deessejs/collections'
 *
 * const nameField = field({ fieldType: f.text() })
 * const emailField = field({ fieldType: f.email() })
 * const bioField = field({ fieldType: f.text({ maxLength: 1000 }) })
 * const statusField = field({ fieldType: f.select(['draft', 'published', 'archived']) })
 * ```
 */
export const f = {
  /**
   * text - Text/string field type
   * @param options - Optional configuration (minLength, maxLength, pattern, extend)
   */
  text: (options: TextFieldOptions = {}): FieldType<string> => {
    let schema: z.ZodType<string> = options.coerce ? z.coerce.string() : z.string()

    if (options.minLength !== undefined) {
      (schema as z.ZodString).min(options.minLength)
    }
    if (options.maxLength !== undefined) {
      (schema as z.ZodString).max(options.maxLength)
    }
    if (options.pattern !== undefined) {
      try {
        (schema as z.ZodString).regex(new RegExp(options.pattern))
      } catch {
        throw new Error(`Invalid regex pattern provided to f.text(): '${options.pattern}'`)
      }
    }
    if (options.extend) {
      schema = options.extend(schema as z.ZodString) as z.ZodType<string>
    }

    return fieldType({
      type: 'text',
      schema,
      columnType: createVarchar(options.maxLength ?? 255),
    })
  },

  /**
   * email - Email field type with validation
   * Stores as varchar(255) and validates email format
   */
  email: (): FieldType<string> =>
    fieldType({
      type: 'email',
      schema: z.string().email(),
      columnType: createVarchar(255),
      transform: (value: unknown) => {
        if (typeof value === 'string') {
          return value.toLowerCase().trim()
        }
        return String(value).toLowerCase().trim()
      },
    }),

  /**
   * url - URL field type with validation
   * Stores as varchar(500) and validates URL format
   */
  url: (): FieldType<string> =>
    fieldType({
      type: 'url',
      schema: z.string().url(),
      columnType: createVarchar(500),
      transform: (value: unknown) => {
        if (typeof value === 'string') {
          return value.trim()
        }
        return String(value).trim()
      },
    }),

  /**
   * number - Number field type
   * @param options - Optional configuration (min, max, extend, coerce)
   */
  number: (options: NumberFieldOptions = {}): FieldType<number> => {
    let schema: z.ZodType<number> = options.coerce ? z.coerce.number() : z.number()

    if (options.min !== undefined) {
      (schema as z.ZodNumber).min(options.min)
    }
    if (options.max !== undefined) {
      (schema as z.ZodNumber).max(options.max)
    }
    if (options.extend) {
      schema = options.extend(schema as z.ZodNumber) as z.ZodType<number>
    }

    return fieldType({
      type: 'number',
      schema,
      columnType: createSimpleColumn('integer'),
    })
  },

  /**
   * decimal - Decimal number field type with precision
   * @param precision - Total number of digits
   * @param scale - Number of digits after decimal
   */
  decimal: (precision: number, scale: number): FieldType<number> =>
    fieldType({
      type: 'decimal',
      schema: z.number(),
      columnType: createDecimalColumn(precision, scale),
    }),

  /**
   * boolean - Boolean field type
   */
  boolean: (): FieldType<boolean> =>
    fieldType({
      type: 'boolean',
      schema: z.boolean(),
      columnType: createSimpleColumn('boolean'),
    }),

  /**
   * date - Date field type (date only, no time)
   */
  date: (): FieldType<Date> =>
    fieldType({
      type: 'date',
      schema: z.date(),
      columnType: createSimpleColumn('date'),
    }),

  /**
   * timestamp - Timestamp field type (date with time)
   */
  timestamp: (): FieldType<Date> =>
    fieldType({
      type: 'timestamp',
      schema: z.date(),
      columnType: createSimpleColumn('timestamp'),
    }),

  /**
   * timestampTz - Timestamp with timezone field type
   */
  timestampTz: (): FieldType<Date> =>
    fieldType({
      type: 'timestamptz',
      schema: z.date(),
      columnType: createSimpleColumn('timestamptz'),
    }),

  /**
   * json - JSON field type
   * Stores arbitrary JSON values
   */
  json: (): FieldType<unknown> =>
    fieldType({
      type: 'json',
      schema: z.any(),
      columnType: createSimpleColumn('json'),
    }),

  /**
   * jsonb - JSONB field type (binary JSON, better query performance)
   */
  jsonb: (): FieldType<unknown> =>
    fieldType({
      type: 'jsonb',
      schema: z.any(),
      columnType: createSimpleColumn('jsonb'),
    }),

  /**
   * uuid - UUID field type
   * Stores universally unique identifiers
   */
  uuid: (): FieldType<string> =>
    fieldType({
      type: 'uuid',
      schema: z.string().uuid(),
      columnType: createSimpleColumn('uuid'),
    }),

  /**
   * select - Enum/select field type
   * @param values - Array of allowed string values (must have at least 1 value)
   *
   * @example
   * ```typescript
   * f.select(['draft', 'published', 'archived'])
   * ```
   */
  select: <Values extends [string, ...string[]]>(values: Values): FieldType<Values[number]> =>
    fieldType({
      type: 'select',
      schema: z.enum(values),
      columnType: createEnumColumn([...values]),
    }),

  /**
   * relation - Relation field type for linking collections
   * Stores a UUID reference to another collection
   *
   * @example
   * ```typescript
   * f.relation()
   * ```
   */
  relation: (): FieldType<string> =>
    fieldType({
      type: 'relation',
      schema: z.string(),
      columnType: createSimpleColumn('uuid'),
    }),

  /**
   * array - Array field type for storing lists
   * Respects the transform function of the item type
   * @param itemType - The field type of array elements
   *
   * @example
   * ```typescript
   * f.array(f.text())  // Array of strings
   * f.array(f.email()) // Array of emails (each lowercased)
   * ```
   */
  array: <T>(itemType: FieldType<T>): FieldType<T[]> =>
    fieldType({
      type: 'array',
      schema: z.array(itemType.schema),
      columnType: createSimpleColumn('json'),
      transform: (value: unknown) =>
        safeTransformArray(itemType.type, itemType.transform, value),
    }),

  /**
   * richtext - Rich text field type
   * Uses text column type for storing HTML or markdown content
   */
  richtext: (): FieldType<string> =>
    fieldType({
      type: 'richtext',
      schema: z.string(),
      columnType: createSimpleColumn('text'),
    }),

  /**
   * file - File field type for storing file paths or URLs
   * Stores as varchar(500)
   */
  file: (): FieldType<string | undefined> =>
    fieldType({
      type: 'file',
      schema: z.string().optional(),
      columnType: createVarchar(500),
    }),
} as const
