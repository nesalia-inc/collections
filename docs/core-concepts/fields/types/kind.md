# ColumnType

Union type of all available column types in the database.

## Type Definition

```typescript
export type ColumnType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'email'
  | 'url'
  | 'select'
  | 'jsonb'
  | 'file'
  | 'relation'
```

## Usage

This type is useful for:
- Type-safe field type comparisons
- Validation logic
- Type narrowing in generic functions

```typescript
import { type ColumnType, field, f } from '@deessejs/collections'

function isPrimitiveColumn(type: ColumnType): boolean {
  return ['text', 'number', 'boolean', 'date', 'timestamp'].includes(type)
}

// Example: checking column types
const textField = f.text()
const jsonField = f.json()

console.log(isPrimitiveColumn(textField.type)) // true
console.log(isPrimitiveColumn(jsonField.type)) // false
```

## Column Type Reference

| Type | Column Type | Description |
|------|-------------|-------------|
| `f.text()` | `'text'` | String value |
| `f.number()` | `'number'` | Numeric value |
| `f.boolean()` | `'boolean'` | True/false value |
| `f.date()` | `'date'` | Date only |
| `f.timestamp()` | `'timestamp'` | Date with time |
| `f.email()` | `'email'` | Email with validation |
| `f.url()` | `'url'` | URL with validation |
| `f.select()` | `'select'` | Enum value |
| `f.json()` | `'jsonb'` | JSON object |
| `f.array()` | `'jsonb'` | Array of values |
| `f.file()` | `'file'` | File reference |
| `f.relation()` | `'relation'` | Relation to another collection |