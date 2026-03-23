# FieldTypeKind

Union type of all available field types in the database.

## Type Definition

```typescript
export type FieldTypeKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'email'
  | 'url'
  | 'select'
  | 'json'
  | 'array'
  | 'richtext'
  | 'file'
  | 'relation'
```

## Usage

This type is useful for:
- Type-safe field type comparisons
- Validation logic
- Type narrowing in generic functions

```typescript
import { type FieldTypeKind, field, f } from '@deessejs/collections'

function isPrimitiveField(type: FieldTypeKind): boolean {
  return ['text', 'number', 'boolean', 'date', 'timestamp'].includes(type)
}

// Example: checking field types
const textField = f.text()
const relationField = f.relation({ to: 'users' })

console.log(isPrimitiveField(textField.type)) // true
console.log(isPrimitiveField(relationField.type)) // false
```

## Field Type Reference

| Type | Kind | Description |
|------|------|-------------|
| `f.text()` | `'text'` | String value |
| `f.number()` | `'number'` | Numeric value |
| `f.boolean()` | `'boolean'` | True/false value |
| `f.date()` | `'date'` | Date only |
| `f.timestamp()` | `'timestamp'` | Date with time |
| `f.email()` | `'email'` | Email with validation |
| `f.url()` | `'url'` | URL with validation |
| `f.select()` | `'select'` | Enum value |
| `f.json()` | `'json'` | JSON object |
| `f.array()` | `'array'` | Array of values |
| `f.richtext()` | `'richtext'` | Rich text content |
| `f.file()` | `'file'` | File reference |
| `f.relation()` | `'relation'` | Relation to another collection |