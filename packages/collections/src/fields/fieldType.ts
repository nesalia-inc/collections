// FieldType factory - creates field type configurations

import type { FieldType, FieldTypeOptions } from './types'

/**
 * fieldType - Factory function to create a field type
 *
 * @param options - Configuration for the field type
 * @returns A configured FieldType
 *
 * @example
 * ```typescript
 * const textField = fieldType({
 *   type: 'text',
 *   schema: z.string(),
 *   columnType: text()
 * })
 * ```
 */
export function fieldType<T>(
  options: FieldTypeOptions<T>
): FieldType<T> {
  return Object.freeze({
    type: options.type,
    schema: options.schema,
    columnType: options.columnType,
    transform: options.transform,
  })
}
