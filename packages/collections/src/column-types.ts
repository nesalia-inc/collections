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
  | { name: 'json' }
  | { name: 'jsonb' }
  | { name: 'uuid' }
  | { name: 'enum'; values: string[] }

// Numeric types
export const serial = (): ColumnType => ({ name: 'serial' })
export const integer = (): ColumnType => ({ name: 'integer' })
export const numeric = (precision: number, scale: number): ColumnType => ({
  name: 'numeric',
  precision,
  scale,
})
export const decimal = (precision: number, scale: number): ColumnType => ({
  name: 'decimal',
  precision,
  scale,
})
export const real = (): ColumnType => ({ name: 'real' })

// Character types
export const text = (): ColumnType => ({ name: 'text' })
export const varchar = (length: number): ColumnType => ({
  name: 'varchar',
  length,
})
export const char = (length: number): ColumnType => ({
  name: 'char',
  length,
})

// Boolean
export const boolean = (): ColumnType => ({ name: 'boolean' })

// Date/Time types
export const date = (): ColumnType => ({ name: 'date' })
export const timestamp = (): ColumnType => ({ name: 'timestamp' })

// JSON types
export const json = (): ColumnType => ({ name: 'json' })
export const jsonb = (): ColumnType => ({ name: 'jsonb' })

// Other types
export const uuid = (): ColumnType => ({ name: 'uuid' })
export const enum_ = (values: string[]): ColumnType => ({
  name: 'enum',
  values,
})
