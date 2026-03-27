// Field type definitions

import type { ColumnType } from '../column-types'
import type { z } from 'zod'

/**
 * FieldTypeOptions - Configuration for creating a field type
 * @typeParam T - The TypeScript type of the field value
 */
export interface FieldTypeOptions<T> {
  /** Unique identifier for this field type */
  readonly type: string

  /** Zod schema for validation */
  readonly schema: z.ZodType<T>

  /** Column type for database mapping */
  readonly columnType: ColumnType

  /** Optional transformation function (e.g., toLowerCase for emails). Defaults to identity. */
  readonly transform?: (value: unknown) => T
}

/**
 * FieldType<T> - A configured field type ready for use
 * @typeParam T - The TypeScript type of the field value
 */
export interface FieldType<T> {
  /** Unique identifier for this field type */
  readonly type: string

  /** Zod schema for validation */
  readonly schema: z.ZodType<T>

  /** Column type for database mapping */
  readonly columnType: ColumnType

  /** Transformation function (always provided by fieldType factory) */
  readonly transform: (value: unknown) => T
}

/**
 * FieldOptions - Configuration for creating a field
 * @typeParam T - The TypeScript type of the field value
 */
export interface FieldOptions<T> {
  /** The field type (required) */
  readonly fieldType: FieldType<T>

  /** Whether the field is required (default: false) */
  readonly required?: boolean

  /** Static default value */
  readonly defaultValue?: T

  /** Factory function for dynamic default values */
  readonly defaultFactory?: () => T

  /** Unique constraint */
  readonly unique?: boolean

  /** Indexed for query performance */
  readonly indexed?: boolean
}

/**
 * Field<T> - A configured field ready for use in a collection
 * @typeParam T - The TypeScript type of the field value
 */
export interface Field<T> {
  /** The field type configuration */
  readonly fieldType: FieldType<T>

  /** Whether the field is required */
  readonly required: boolean

  /** Default value getter (may be undefined if no default) */
  readonly defaultValue: (() => T) | undefined

  /** Unique constraint */
  readonly unique: boolean

  /** Indexed for query performance */
  readonly indexed: boolean
}

/**
 * TextFieldOptions - Options for text field type
 */
export interface TextFieldOptions {
  readonly minLength?: number
  readonly maxLength?: number
  readonly pattern?: string
}

/**
 * NumberFieldOptions - Options for number field type
 */
export interface NumberFieldOptions {
  readonly min?: number
  readonly max?: number
  readonly precision?: number
  readonly scale?: number
}

/**
 * SelectFieldOptions - Options for select/enum field type
 */
export interface SelectFieldOptions {
  readonly values: readonly [string, ...string[]]
}

/**
 * RelationFieldOptions - Options for relation field type
 */
export interface RelationFieldOptions {
  readonly to: string
  readonly many?: boolean
  readonly through?: string
  readonly onDelete?: 'cascade' | 'nullify' | 'error'
}

/**
 * ArrayFieldOptions - Options for array field type
 * @typeParam T - The TypeScript type of array elements
 */
export interface ArrayFieldOptions<T> {
  readonly itemType: FieldType<T>
  readonly minLength?: number
  readonly maxLength?: number
}
