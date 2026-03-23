# JSON

```typescript
import { field, f, z } from '@deessejs/collections'

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
const json = fieldType({
  type: 'json',
  columnType: 'jsonb',
  schema: z.any(),
  validation: z.object({})
})

const jsonWithSchema = fieldType({
  type: 'json',
  columnType: 'jsonb',
  schema: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean()
  }),
  validation: z.object({})
})
```

## Validation Flow

1. **Base validation**:
   ```typescript
   db.users.create({ data: { metadata: "not-json" } })
   // Error: metadata must be valid JSON
   ```

2. **Schema validation** (if schema defined):
   ```typescript
   db.users.create({ data: { settings: { theme: "invalid" } } })
   // Error: settings.theme must be 'light' or 'dark'
   ```
