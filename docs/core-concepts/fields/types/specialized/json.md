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
// Factory function accepting optional Zod schema
const json = (schema: z.ZodTypeAny = z.unknown()) => fieldType({
  type: 'json',
  columnType: 'jsonb',
  schema,
  transform: (value) => typeof value === 'string' ? JSON.parse(value) : value,
  validation: z.object({})
})
```

## Validation Flow

1. **Transform** (parse string if needed):
   Automatically parses JSON strings to objects.

2. **Base validation**:
   ```typescript
   db.users.create({ data: { metadata: "not-json" } })
   // Error: metadata must be valid JSON
   ```

3. **Schema validation** (if schema defined):
   ```typescript
   db.users.create({ data: { settings: { theme: "invalid" } } })
   // Error: settings.theme must be 'light' or 'dark'
   ```

## Query Behavior

Filter on JSON properties with full type safety:
```typescript
db.users.find({
  where: (u) => u.settings.theme.eq('dark')
})
```
