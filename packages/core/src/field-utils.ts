import type { FieldOptions } from './field'

/**
 * Mark field as required
 */
export const required = (): Pick<FieldOptions, 'required'> => ({
  required: true
})

/**
 * Mark field as optional
 */
export const optional = (): Pick<FieldOptions, 'required'> => ({
  required: false
})

/**
 * Mark field as unique
 */
export const unique = (): Pick<FieldOptions, 'unique'> => ({
  unique: true
})

/**
 * Mark field as indexed
 */
export const indexed = (): Pick<FieldOptions, 'indexed'> => ({
  indexed: true
})

/**
 * Set default value for field
 */
export const defaultValue = <T>(value: T): Pick<FieldOptions, 'default'> => ({
  default: value
})

/**
 * Set label for field
 */
export const label = (value: string): Pick<FieldOptions, 'label'> => ({
  label: value
})

/**
 * Set description for field
 */
export const description = (value: string): Pick<FieldOptions, 'description'> => ({
  description: value
})
