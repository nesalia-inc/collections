// Column Types
// Low-level functions that return column type objects used by database providers.

export type ColumnType =
  | { name: 'serial' }
  | { name: 'integer' }
  | { name: 'numeric'; precision: number; scale: number }
  | { name: 'decimal'; precision: number; scale: number }
  | { name: 'real' }
  | { name: 'text' }
  | { name: 'varchar'; length: number }
  | { name: 'char'; length: number }
  | { name: 'boolean' }
  | { name: 'date' }
  | { name: 'timestamp' }
  | { name: 'timestamptz' }
  | { name: 'json' }
  | { name: 'jsonb' }
  | { name: 'uuid' }
  | { name: 'enum'; values: string[] }

// Numeric types
export const serial = (): ColumnType => ({ name: 'serial' })
export const integer = (): ColumnType => ({ name: 'integer' })
export const numeric = (precision: number, scale: number): ColumnType => {
  if (precision < scale || precision < 1 || scale < 0) {
    throw new Error('Invalid precision/scale: precision must be >= scale and >= 1')
  }
  return { name: 'numeric', precision, scale }
}
export const decimal = (precision: number, scale: number): ColumnType => {
  if (precision < scale || precision < 1 || scale < 0) {
    throw new Error('Invalid precision/scale: precision must be >= scale and >= 1')
  }
  return { name: 'decimal', precision, scale }
}
export const real = (): ColumnType => ({ name: 'real' })

// Character types
export const text = (): ColumnType => ({ name: 'text' })
export const varchar = (length: number): ColumnType => {
  if (length < 1) {
    throw new Error('Invalid length: must be >= 1')
  }
  return { name: 'varchar', length }
}
export const char = (length: number): ColumnType => {
  if (length < 1) {
    throw new Error('Invalid length: must be >= 1')
  }
  return { name: 'char', length }
}

// Boolean
export const bool = (): ColumnType => ({ name: 'boolean' })

// Date/Time types
export const date = (): ColumnType => ({ name: 'date' })
export const timestamp = (): ColumnType => ({ name: 'timestamp' })
export const timestamptz = (): ColumnType => ({ name: 'timestamptz' })

// JSON types
export const json = (): ColumnType => ({ name: 'json' })
export const jsonb = (): ColumnType => ({ name: 'jsonb' })

// Other types
export const uuid = (): ColumnType => ({ name: 'uuid' })
export const enum_ = (values: string[]): ColumnType => {
  if (!values || values.length === 0) {
    throw new Error('Invalid values: array must not be empty')
  }
  const unique = new Set(values)
  if (unique.size !== values.length) {
    throw new Error('Invalid values: array must not contain duplicates')
  }
  return { name: 'enum', values }
}

// Backwards compatibility alias
/** @deprecated Use bool() instead */
export const boolean = bool
