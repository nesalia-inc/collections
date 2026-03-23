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
  columnType: 'varchar(2048)',
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

## Validation Flow

1. **Transform** (add protocol if missing, trim):
   ```typescript
   db.users.create({ data: { website: "www.google.com" } })
   // Stored as: https://www.google.com
   ```

2. **Base validation**:
   ```typescript
   db.users.create({ data: { website: "not-a-url" } })
   // Error: website must be a valid URL
   ```
