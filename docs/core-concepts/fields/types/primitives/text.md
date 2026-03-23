# Text

```typescript
import { field, f } from '@deessejs/collections'

const name = field({
  fieldType: f.text()
})

// With options
const title = field({
  fieldType: f.text({ minLength: 1, maxLength: 100 })
})
```

## Options

- `minLength` - Minimum string length
- `maxLength` - Maximum string length
- `pattern` - Regex pattern for validation

## Implementation

```typescript
// Base field type - validates that the value is a string
const text = fieldType({
  type: 'text',
  columnType: 'text',
  schema: z.string()
})

// With minimum length constraint
const textMinLength = fieldType({
  type: 'text',
  columnType: 'text',
  schema: z.string(),
  validation: {
    minLength: (value) => value.length >= 1
  }
})

// With maximum length constraint
const textMaxLength = fieldType({
  type: 'text',
  columnType: 'varchar(100)',
  schema: z.string(),
  validation: {
    maxLength: (value) => value.length <= 100
  }
})

// With pattern constraint
const textPattern = fieldType({
  type: 'text',
  columnType: 'text',
  schema: z.string(),
  validation: {
    pattern: (value) => /^[A-Z]+$/.test(value)
  }
})
```

## Validation Flow

When a user creates a record:

1. **Base validation** (always applied):
   ```typescript
   db.users.create({ data: { name: 123 } })
   // Error: name must be a string (base schema z.string())
   ```

2. **User constraint validation** (if defined):
   ```typescript
   db.users.create({ data: { name: "" } })
   // Error: name must have at least 1 character (user-defined constraint)
   ```

## Type Definition

```typescript
type TextOptions = {
  minLength?: number
  maxLength?: number
  pattern?: string
}

type FieldTypeConfig<T> = {
  type: string
  columnType: string
  schema: T
  validation?: {
    minLength?: (value: string) => boolean
    maxLength?: (value: string) => boolean
    pattern?: (value: string) => boolean
  }
  transform?: (value: unknown) => unknown
  prepare?: (value: unknown) => unknown
}
```
