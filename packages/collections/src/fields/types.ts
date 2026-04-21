// Field type definitions

import type { ColumnType } from '../column-types'
import { z } from 'zod'

/**
 * RelationOptions - Configuration for relation field types
 */
export interface RelationOptions {
  /** Target collection slug */
  readonly collection?: string
  /** Whether this is a has-many relationship (creates junction table) */
  readonly hasMany?: boolean
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

  /** Relation options (only for relation field types) */
  readonly relationOptions?: RelationOptions
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
