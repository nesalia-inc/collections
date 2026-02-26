import type { FieldTypeInstance, FieldTypeCreator } from './field-type'

/**
 * Field configuration options
 */
export type FieldOptions = {
  fieldType: FieldTypeCreator
  required?: boolean
  unique?: boolean
  indexed?: boolean
  default?: unknown
  label?: string
  description?: string
}

/**
 * Creates a field definition
 *
 * @example
 * name: field({ fieldType: text() })
 * email: field({ fieldType: email(), unique: true })
 */
export const field = (config: FieldOptions): FieldDefinition => {
  return {
    fieldType: config.fieldType,
    required: config.required ?? false,
    unique: config.unique ?? false,
    indexed: config.indexed ?? false,
    default: config.default,
    label: config.label,
    description: config.description
  }
}

/**
 * A field definition
 */
export type FieldDefinition = {
  fieldType: FieldTypeCreator
  required: boolean
  unique: boolean
  indexed: boolean
  default?: unknown
  label?: string
  description?: string
}
