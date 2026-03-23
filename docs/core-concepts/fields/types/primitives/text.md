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
  columnType: text(),
  schema: z.string(),
  validation: z.object({
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional()
  })
})
```

The `text()` function returns `'text'` (the SQL column type).
