# JSON

```typescript
import { field, f, z } from '@deessejs/collections'

// Free-form JSON
const metadata = field({
  fieldType: f.json()
})

// With Zod schema for type safety
const settings = field({
  fieldType: f.json(z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean()
  }))
})
```

When using a Zod schema, TypeScript infers the type automatically.

## Implementation

```typescript
import { json } from '@deessejs/collections'

// Factory function accepting optional Zod schema
const json = (schema: z.ZodTypeAny = z.unknown()) => fieldType({
  type: 'json',
  columnType: json(),
  schema,
  transform: (value) => typeof value === 'string' ? JSON.parse(value) : value,
  validation: z.object({})
})
```

The `json()` function returns `'jsonb'` (the SQL column type).
