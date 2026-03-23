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
  schema: z.any()
})

const jsonWithSchema = fieldType({
  type: 'json',
  columnType: 'jsonb',
  schema: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean()
  })
})
```
