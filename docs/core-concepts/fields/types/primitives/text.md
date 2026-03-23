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
  columnType: 'text',
  schema: z.string()
})

const textMinLength = fieldType({
  type: 'text',
  columnType: 'text',
  schema: z.string().min(1)
})

const textMaxLength = fieldType({
  type: 'text',
  columnType: 'varchar(100)',
  schema: z.string().max(100)
})

const textPattern = fieldType({
  type: 'text',
  columnType: 'text',
  schema: z.string(),
  validate: (value) => /^[A-Z]+$/.test(value)
})
```

## Type Definition

```typescript
type TextOptions = {
  minLength?: number
  maxLength?: number
  pattern?: string
}
```
