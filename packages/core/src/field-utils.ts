import type { FieldDefinition } from './field'

/**
 * Mark field as required
 */
export const required = (field: FieldDefinition): FieldDefinition => ({
  ...field,
  required: true
})

/**
 * Mark field as optional
 */
export const optional = (field: FieldDefinition): FieldDefinition => ({
  ...field,
  required: false
})

/**
 * Mark field as unique
 */
export const unique = (field: FieldDefinition): FieldDefinition => ({
  ...field,
  unique: true
})

/**
 * Mark field as indexed
 */
export const indexed = (field: FieldDefinition): FieldDefinition => ({
  ...field,
  indexed: true
})

/**
 * Set default value for field
 */
export const defaultValue = <T>(value: T) => (field: FieldDefinition): FieldDefinition => ({
  ...field,
  default: value
})

/**
 * Set label for field
 */
export const label = (value: string) => (field: FieldDefinition): FieldDefinition => ({
  ...field,
  label: value
})

/**
 * Set description for field
 */
export const description = (value: string) => (field: FieldDefinition): FieldDefinition => ({
  ...field,
  description: value
})
