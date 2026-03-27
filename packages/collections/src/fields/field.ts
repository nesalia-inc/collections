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

  // Normalize defaultValue: static values become getter functions
  // This ensures a consistent interface (() => T) for the internal engine
  // Note: When typeof defaultValue === 'function', we trust the caller provides () => T
  // This is a deliberate type coercion since FieldOptions allows both T and () => T
  const normalizedDefault = defaultValue === undefined
    ? undefined
    : typeof defaultValue === 'function'
      ? (defaultValue as () => T)
      : () => defaultValue

  return Object.freeze({
    fieldType,
    required,
    defaultValue: normalizedDefault,
    unique,
    indexed,
  })
}

/**
 * isField - Type guard to check if a value is a Field
 */
export function isField(value: unknown): value is Field<unknown> {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Record<string, unknown>

  return (
    'fieldType' in candidate &&
    typeof candidate.fieldType === 'object' &&
    candidate.fieldType !== null &&
    'type' in candidate.fieldType &&
    typeof (candidate.fieldType as Record<string, unknown>).type === 'string' &&
    'required' in candidate &&
    'unique' in candidate &&
    'indexed' in candidate
  )
}
