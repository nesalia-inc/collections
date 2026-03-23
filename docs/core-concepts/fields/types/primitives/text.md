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
const text = fieldType({
  type: 'text',
  columnType: options?.maxLength ? `varchar(${options.maxLength})` : 'text',
  schema: z.string(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional()
  })
})
```

## Validation Flow

When a user creates a record:

1. **Base validation** (always applied):
   ```typescript
   db.users.create({ data: { name: 123 } })
   // Error: name must be a string (base schema z.string())
   ```

2. **User constraint validation** (if options defined):
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
```
