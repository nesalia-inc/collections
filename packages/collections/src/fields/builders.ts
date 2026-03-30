// Field type builders - internal implementation of each field type

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
 * text - Text/string field type builder
 */
export const buildText = (options: TextFieldOptions = {}): FieldType<string> => {
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
}

/**
 * email - Email field type builder
 */
export const buildEmail = (): FieldType<string> =>
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
  })

/**
 * url - URL field type builder
 */
export const buildUrl = (): FieldType<string> =>
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
  })

/**
 * number - Number field type builder
 */
export const buildNumber = (options: NumberFieldOptions = {}): FieldType<number> => {
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
}

/**
 * decimal - Decimal field type builder
 */
export const buildDecimal = (precision: number, scale: number): FieldType<number> =>
  fieldType({
    type: 'decimal',
    schema: z.number(),
    columnType: createDecimalColumn(precision, scale),
  })

/**
 * boolean - Boolean field type builder
 */
export const buildBoolean = (): FieldType<boolean> =>
  fieldType({
    type: 'boolean',
    schema: z.boolean(),
    columnType: createSimpleColumn('boolean'),
  })

/**
 * date - Date field type builder
 */
export const buildDate = (): FieldType<Date> =>
  fieldType({
    type: 'date',
    schema: z.date(),
    columnType: createSimpleColumn('date'),
  })

/**
 * timestamp - Timestamp field type builder
 */
export const buildTimestamp = (): FieldType<Date> =>
  fieldType({
    type: 'timestamp',
    schema: z.date(),
    columnType: createSimpleColumn('timestamp'),
  })

/**
 * timestampTz - Timestamp with timezone field type builder
 */
export const buildTimestampTz = (): FieldType<Date> =>
  fieldType({
    type: 'timestamptz',
    schema: z.date(),
    columnType: createSimpleColumn('timestamptz'),
  })

/**
 * json - JSON field type builder
 */
export const buildJson = (): FieldType<unknown> =>
  fieldType({
    type: 'json',
    schema: z.any(),
    columnType: createSimpleColumn('json'),
  })

/**
 * jsonb - JSONB field type builder
 */
export const buildJsonb = (): FieldType<unknown> =>
  fieldType({
    type: 'jsonb',
    schema: z.any(),
    columnType: createSimpleColumn('jsonb'),
  })

/**
 * uuid - UUID field type builder
 */
export const buildUuid = (): FieldType<string> =>
  fieldType({
    type: 'uuid',
    schema: z.string().uuid(),
    columnType: createSimpleColumn('uuid'),
  })

/**
 * select - Select/enum field type builder
 */
export const buildSelect = <Values extends [string, ...string[]]>(values: Values): FieldType<Values[number]> =>
  fieldType({
    type: 'select',
    schema: z.enum(values),
    columnType: createEnumColumn([...values]),
  })

/**
 * relation - Relation field type builder
 */
export const buildRelation = (): FieldType<string> =>
  fieldType({
    type: 'relation',
    schema: z.string(),
    columnType: createSimpleColumn('uuid'),
  })

/**
 * array - Array field type builder
 */
export const buildArray = <T>(itemType: FieldType<T>): FieldType<T[]> =>
  fieldType({
    type: 'array',
    schema: z.array(itemType.schema),
    columnType: createSimpleColumn('json'),
    transform: (value: unknown) =>
      safeTransformArray(itemType.type, itemType.transform, value),
  })

/**
 * richtext - Rich text field type builder
 */
export const buildRichtext = (): FieldType<string> =>
  fieldType({
    type: 'richtext',
    schema: z.string(),
    columnType: createSimpleColumn('text'),
  })

/**
 * file - File field type builder
 */
export const buildFile = (): FieldType<string | undefined> =>
  fieldType({
    type: 'file',
    schema: z.string().optional(),
    columnType: createVarchar(500),
  })
