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
const text = (options?: TextOptions): FieldType =>
  fieldType({
    type: 'text',
    columnType: options?.maxLength ? `varchar(${options.maxLength})` : 'text',
    schema: options?.minLength || options?.maxLength
      ? z.string().min(options.minLength ?? 0).max(options.maxLength!)
      : z.string(),
    options: options?.pattern ? { validate: (v) => new RegExp(options.pattern!).test(v) } : undefined
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
