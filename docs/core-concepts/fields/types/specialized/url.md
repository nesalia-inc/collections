# URL

```typescript
import { field, f } from '@deessejs/collections'

const website = field({
  fieldType: f.url()
})
```

Includes built-in URL validation with automatic normalization.

## Implementation

```typescript
const url = fieldType({
  type: 'url',
  columnType: url(),
  schema: z.string().url(),
  transform: (value) => {
    const trimmed = value?.trim()
    if (!trimmed) return trimmed
    // Add https:// if protocol is missing
    if (!/^[a-z]+:/i.test(trimmed)) {
      return `https://${trimmed}`
    }
    return trimmed
  },
  validation: z.object({})
})
```

The `url()` function returns `'url'` (the SQL column type).
