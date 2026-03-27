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
 *     }),
 *     createdAt: field({
 *       fieldType: f.timestamp(),
 *       defaultFactory: () => new Date()
 *     })
 *   }
 * })
 * ```
 */
export function field<T>(options: FieldOptions<T>): Field<T> {
  const { fieldType, required = false, defaultValue, defaultFactory, unique = false, indexed = false } = options

  // Runtime validation: ensure defaultValue matches the fieldType schema
  if (defaultValue !== undefined) {
    const validation = fieldType.schema.safeParse(defaultValue)
    if (!validation.success) {
      throw new Error(
        `Invalid defaultValue for field type '${fieldType.type}': ${validation.error.message}`
      )
    }
  }

  // Build lazy getter: prefer factory if provided, otherwise wrap static value
  let lazyDefault: (() => T) | undefined = undefined

  if (defaultFactory !== undefined) {
    lazyDefault = defaultFactory
  } else if (defaultValue !== undefined) {
    lazyDefault = () => defaultValue
  }

  return Object.freeze({
    fieldType,
    required,
    defaultValue: lazyDefault,
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
