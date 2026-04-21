// FieldType factory - creates configurable field type definitions

import type { ColumnType } from '../column-types'
import type { FieldType } from './types'
import { z } from 'zod'
import { isOk, type Result, type Error } from '@deessejs/core'

/**
 * FieldTypeOption - Definition of a single option
 */
export interface FieldTypeOption<T> {
  readonly schema: z.ZodType<T>
  readonly default?: T
}

/**
 * FieldTypeOptionsConfig - Configuration for all options of a field type
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FieldTypeOptionsConfig {
  readonly [key: string]: FieldTypeOption<unknown>
}

/**
 * ResolvedOptions - Options passed by the user
 */
export type ResolvedOptions<T extends FieldTypeOptionsConfig> = {
  [K in keyof T]?: z.infer<T[K]['schema']>
}

/**
 * ApplyOptionsFn - Function to apply options to a schema
 */
export type ApplyOptionsFn<T, Options extends FieldTypeOptionsConfig> = (
  schema: z.ZodType<T>,
  options: ResolvedOptions<Options>
) => z.ZodType<T>

/**
 * BuildColumnTypeFn - Function to build the column type from options
 */
export type BuildColumnTypeFn<Options extends FieldTypeOptionsConfig> = (
  options: ResolvedOptions<Options>
) => Result<ColumnType, Error>

/**
 * FieldTypeConfig - Configuration for creating a field type
 * @typeParam T - The TypeScript type of the field value
 * @typeParam Options - The configuration options schema
 */
export interface FieldTypeConfig<
  T,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Options extends FieldTypeOptionsConfig = {}
> {
  /** Unique identifier for this field type */
  readonly type: string

  /** Base Zod schema for validation */
  readonly schema: z.ZodType<T>

  /** Options configuration */
  readonly options?: Options

  /** Function to apply options to the schema */
  readonly applyOptions?: ApplyOptionsFn<T, Options>

  /** Function to build the column type from options */
  readonly buildColumnType: BuildColumnTypeFn<Options>

  /** Optional transform function */
  readonly transform?: (value: unknown) => T
}

/**
 * FieldTypeBuilder - A configured field type ready to accept options
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FieldTypeBuilder<T, Options extends FieldTypeOptionsConfig = {}> {
  (options?: ResolvedOptions<Options>): FieldType<T>
  readonly config: FieldTypeConfig<T, Options>
}

/**
 * fieldType - Factory function to create a configurable field type
 *
 * @param config - Configuration for the field type
 * @returns A FieldTypeBuilder function
 *
 * @example
 * ```typescript
 * const textFieldType = fieldType({
 *   type: 'text',
 *   schema: z.string(),
 *   options: {
 *     minLength: { schema: z.number(), default: undefined },
 *     maxLength: { schema: z.number(), default: undefined },
 *   },
 *   applyOptions: (schema, options) => {
 *     if (options.minLength !== undefined) schema = schema.min(options.minLength)
 *     if (options.maxLength !== undefined) schema = schema.max(options.maxLength)
 *     return schema
 *   },
 *   buildColumnType: (options) => varchar(options?.maxLength ?? 255)
 * })
 *
 * // Usage
 * const ft = textFieldType({ maxLength: 100 })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function fieldType<
  T,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Options extends FieldTypeOptionsConfig = {}
>(
  config: FieldTypeConfig<T, Options>
): FieldTypeBuilder<T, Options> {
  const builder = (userOptions?: ResolvedOptions<Options>): FieldType<T> => {
    // Merge user options with defaults
    const resolvedOptions: Record<string, unknown> = {}
    if (config.options) {
      for (const key of Object.keys(config.options)) {
        const optionConfig = config.options[key]
        ;(resolvedOptions as Record<string, unknown>)[key] =
          (userOptions as Record<string, unknown>)?.[key] ?? optionConfig.default
      }
    }

    // Apply options to schema if applyOptions is provided
    const finalSchema = config.applyOptions
      ? config.applyOptions(config.schema, resolvedOptions as ResolvedOptions<Options>)
      : config.schema

    // Build column type
    const columnTypeResult = config.buildColumnType(resolvedOptions as ResolvedOptions<Options>)
    if ('isOk' in columnTypeResult) {
      // It's a Result type - check if it's Ok before unwrapping
      if (!isOk(columnTypeResult)) {
        throw new Error(`Failed to build column type: ${String(columnTypeResult.error)}`)
      }
      // Use value property directly for Result types
      const columnType = (columnTypeResult as { value: ColumnType }).value

      // Default identity transform if none provided
      const transform = config.transform ?? ((val: unknown) => val as T)

      return Object.freeze({
        type: config.type,
        schema: finalSchema,
        columnType,
        transform,
      })
    } else {
      // It's a plain object (legacy/backward-compatible behavior)
      // Default identity transform if none provided
      const transform = config.transform ?? ((val: unknown) => val as T)

      return Object.freeze({
        type: config.type,
        schema: finalSchema,
        columnType: columnTypeResult as ColumnType,
        transform,
      })
    }
  }

  // Attach config as non-enumerable property
  Object.defineProperty(builder, 'config', {
    value: Object.freeze({ ...config }),
    enumerable: false,
    writable: false,
    configurable: false,
  })

  return builder as FieldTypeBuilder<T, Options>
}
