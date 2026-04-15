/**
 * fieldToRawColumn - Maps a Field to a RawColumn
 *
 * This function is part of the two-layer adapter architecture:
 *   Field (High-Level) → fieldToRawColumn → RawColumn (Mid-Level IR) → buildDrizzleTable → Drizzle Schema
 */

import type { Field } from '../../fields'
import type { RawColumn, BaseColumn } from './types'
import { toSnakeCase } from './utils'
import { ok, err, type Result, error, type ExtractError } from '@deessejs/core'
import { z } from 'zod'

/**
 * Error builder for unhandled column type
 */
const UnhandledColumnTypeError = error({
  name: 'UnhandledColumnType',
  schema: z.object({
    columnType: z.unknown(),
  }),
  message: (args) => `Unhandled ColumnType: ${JSON.stringify(args.columnType)}`,
})

/**
 * Options for fieldToRawColumn
 */
export interface FieldToRawColumnOptions {
  /**
   * Prefix for enum column names
   * e.g., 'post_' → 'post_status' instead of 'status'
   */
  readonly enumNamePrefix?: string
}

/**
 * Maps a Field's columnType to a RawColumn variant
 *
 * Rules:
 * - Field name is converted to snake_case for the column name
 * - notNull is set when field is required AND has no default value
 * - default comes from the lazy getter (evaluates at mapping time)
 *
 * @param fieldName - The field name in camelCase (e.g., 'firstName')
 * @param field - The Field to convert
 * @param options - Optional configuration
 * @returns The corresponding RawColumn
 */
export const fieldToRawColumn = (
  fieldName: string,
  field: Field<unknown>,
  options?: FieldToRawColumnOptions
): Result<RawColumn, ExtractError<typeof UnhandledColumnTypeError>> => {
  const columnType = field.fieldType.columnType
  const snakeName = toSnakeCase(fieldName)

  // notNull: required fields without a default need NOT NULL constraint
  // If field has a default (value or factory), DB can provide the value
  const notNull = field.required && !field.defaultValue

  // Base column properties shared by all types
  const base: BaseColumn = {
    name: snakeName,
    notNull: notNull || undefined,
    default: field.defaultValue?.(),
  }

  // Map ColumnType.name to RawColumn variant
  switch (columnType.name) {
    case 'boolean':
      return ok({ type: 'boolean', ...base })

    case 'integer':
      return ok({ type: 'integer', ...base })

    case 'numeric':
      return ok({
        type: 'numeric',
        precision: columnType.precision,
        scale: columnType.scale,
        ...base,
      })

    case 'decimal':
      return ok({
        type: 'decimal',
        precision: columnType.precision,
        scale: columnType.scale,
        ...base,
      })

    case 'real':
      return ok({ type: 'real', ...base })

    case 'text':
      return ok({ type: 'text', ...base })

    case 'varchar':
      return ok({ type: 'varchar', length: columnType.length, ...base })

    case 'char':
      return ok({ type: 'char', length: columnType.length, ...base })

    case 'date':
      return ok({ type: 'date', ...base })

    case 'timestamp':
      return ok({ type: 'timestamp', ...base })

    case 'timestamptz':
      return ok({ type: 'timestamptz', ...base })

    case 'json':
      return ok({ type: 'json', ...base })

    case 'jsonb':
      return ok({ type: 'jsonb', ...base })

    case 'uuid':
      return ok({ type: 'uuid', ...base })

    case 'enum':
      return ok({
        type: 'enum',
        enumName: options?.enumNamePrefix
          ? `${options.enumNamePrefix}${snakeName}`
          : snakeName,
        options: columnType.values,
        ...base,
      })

    // Serial is not created by field builders - it's auto-generated for primary keys
    case 'serial':
      return ok({ type: 'serial', ...base })

    default: {
      // Exhaustiveness check - this will cause a compile error if a new ColumnType is added
      const _exhaustive: never = columnType
      return err(UnhandledColumnTypeError({ columnType: _exhaustive }))
    }
  }
}
