import type { FieldDefinition } from './field'

/**
 * Mark field as required
 */
export const required = (): Pick<FieldDefinition, 'required'> => ({
  required: true
})

/**
 * Mark field as optional
 */
export const optional = (): Pick<FieldDefinition, 'required'> => ({
  required: false
})

/**
 * Mark field as unique
 */
export const unique = (): Pick<FieldDefinition, 'unique'> => ({
  unique: true
})

/**
 * Mark field as indexed
 */
export const indexed = (): Pick<FieldDefinition, 'indexed'> => ({
  indexed: true
})

/**
 * Set default value for field
 */
export const defaultValue = <T>(value: T): Pick<FieldDefinition, 'default'> => ({
  default: value
})

/**
 * Set label for field
 */
export const label = (value: string): Pick<FieldDefinition, 'label'> => ({
  label: value
})

/**
 * Set description for field
 */
export const description = (value: string): Pick<FieldDefinition, 'description'> => ({
  description: value
})
