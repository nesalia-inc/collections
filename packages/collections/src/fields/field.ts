// field() function - creates a configured field for use in collections

import type { Field, FieldOptions } from './types'

/**
 * field - Creates a configured field for use in a collection
 *
 * @param options - Field configuration options
 * @returns A configured Field ready for use in a collection
 *
 * @example
 * ```typescript
 * import { collection, field, f } from '@deessejs/collections'
 *
 * const users = collection({
 *   slug: 'users',
 *   fields: {
 *     name: field({ fieldType: f.text() }),
 *     email: field({ fieldType: f.email(), unique: true }),
 *     age: field({ fieldType: f.number(), required: true }),
 *     status: field({
 *       fieldType: f.select(['active', 'inactive']),
 *       defaultValue: 'active'
 *     })
 *   }
 * })
 * ```
 */
export function field<T>(options: FieldOptions<T>): Field<T> {
  const { fieldType, required = false, defaultValue, unique = false, indexed = false } = options

  return Object.freeze({
    fieldType,
    required,
    defaultValue: typeof defaultValue === 'function'
      ? (defaultValue as () => T)
      : defaultValue !== undefined
        ? (() => defaultValue as T)
        : undefined,
    unique,
    indexed,
  })
}

/**
 * isField - Type guard to check if a value is a Field
 */
export function isField(value: unknown): value is Field<unknown> {
  if (value === null || typeof value !== 'object') return false
  const f = value as Record<string, unknown>
  return (
    'fieldType' in f &&
    typeof f.fieldType === 'object' &&
    f.fieldType !== null &&
    'type' in f.fieldType &&
    typeof f.type === 'string'
  )
}
