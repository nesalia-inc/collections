// Predefined field types factory - provides common field types via the `f` object

import { z } from 'zod'
import { fieldType } from './fieldType'
import type { FieldType } from './types'

import {
  enum_ as columnEnum,
  type ColumnType,
} from '../column-types'

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
 * const statusField = field({ fieldType: f.select(['draft', 'published', 'archived']) })
 * ```
 */
export const f = {
  /**
   * text - Text/string field type
   * Uses varchar(255) as column type
   */
  text: (): FieldType<string> =>
    fieldType({
      type: 'text',
      schema: z.string(),
      columnType: { name: 'varchar', length: 255 } as ColumnType,
    }),

  /**
   * email - Email field type with validation
   * Stores as varchar(255) and validates email format
   */
  email: (): FieldType<string> =>
    fieldType({
      type: 'email',
      schema: z.string().email(),
      columnType: { name: 'varchar', length: 255 } as ColumnType,
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
      columnType: { name: 'varchar', length: 500 } as ColumnType,
      transform: (value: unknown) => {
        if (typeof value === 'string') {
          return value.trim()
        }
        return String(value).trim()
      },
    }),

  /**
   * number - Number field type
   * Uses integer as column type
   */
  number: (): FieldType<number> =>
    fieldType({
      type: 'number',
      schema: z.number(),
      columnType: { name: 'integer' } as ColumnType,
    }),

  /**
   * decimal - Decimal number field type with precision
   * @param precision - Total number of digits
   * @param scale - Number of digits after decimal
   */
  decimal: (precision: number, scale: number): FieldType<number> =>
    fieldType({
      type: 'decimal',
      schema: z.number(),
      columnType: {
        name: 'decimal' as const,
        precision,
        scale,
      },
    }),

  /**
   * boolean - Boolean field type
   */
  boolean: (): FieldType<boolean> =>
    fieldType({
      type: 'boolean',
      schema: z.boolean(),
      columnType: { name: 'boolean' } as ColumnType,
    }),

  /**
   * date - Date field type (date only, no time)
   */
  date: (): FieldType<Date> =>
    fieldType({
      type: 'date',
      schema: z.date(),
      columnType: { name: 'date' } as ColumnType,
    }),

  /**
   * timestamp - Timestamp field type (date with time)
   */
  timestamp: (): FieldType<Date> =>
    fieldType({
      type: 'timestamp',
      schema: z.date(),
      columnType: { name: 'timestamp' } as ColumnType,
    }),

  /**
   * timestampTz - Timestamp with timezone field type
   */
  timestampTz: (): FieldType<Date> =>
    fieldType({
      type: 'timestamptz',
      schema: z.date(),
      columnType: { name: 'timestamptz' } as ColumnType,
    }),

  /**
   * json - JSON field type
   * Stores arbitrary JSON values
   */
  json: (): FieldType<unknown> =>
    fieldType({
      type: 'json',
      schema: z.any(),
      columnType: { name: 'json' } as ColumnType,
    }),

  /**
   * jsonb - JSONB field type (binary JSON, better query performance)
   */
  jsonb: (): FieldType<unknown> =>
    fieldType({
      type: 'jsonb',
      schema: z.any(),
      columnType: { name: 'jsonb' } as ColumnType,
    }),

  /**
   * uuid - UUID field type
   * Stores universally unique identifiers
   */
  uuid: (): FieldType<string> =>
    fieldType({
      type: 'uuid',
      schema: z.string().uuid(),
      columnType: { name: 'uuid' } as ColumnType,
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
  select: <Values extends [string, ...string[]]>(values: Values): FieldType<Values[number]> => {
    const columnResult = columnEnum([...values])
    const columnType = columnResult.ok ? columnResult.value : { name: 'enum' as const, values: [...values] }

    return fieldType({
      type: 'select',
      schema: z.enum(values),
      columnType,
    })
  },

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
      columnType: { name: 'uuid' } as ColumnType,
    }),

  /**
   * array - Array field type for storing lists
   * @param itemType - The field type of array elements
   *
   * @example
   * ```typescript
   * f.array(f.text())  // Array of strings
   * f.array(f.uuid())  // Array of UUIDs
   * ```
   */
  array: <T>(itemType: FieldType<T>): FieldType<T[]> =>
    fieldType({
      type: 'array',
      schema: z.array(itemType.schema),
      columnType: { name: 'json' } as ColumnType,
    }),

  /**
   * richtext - Rich text field type
   * Uses text column type for storing HTML or markdown content
   */
  richtext: (): FieldType<string> =>
    fieldType({
      type: 'richtext',
      schema: z.string(),
      columnType: { name: 'text' } as ColumnType,
    }),

  /**
   * file - File field type for storing file paths or URLs
   * Stores as varchar(500)
   */
  file: (): FieldType<string | undefined> =>
    fieldType({
      type: 'file',
      schema: z.string().optional(),
      columnType: { name: 'varchar', length: 500 } as ColumnType,
    }),
} as const
