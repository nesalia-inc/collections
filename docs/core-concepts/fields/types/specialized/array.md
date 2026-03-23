# Array

```typescript
import { field, f, z } from '@deessejs/collections'

// Array of strings
const tags = field({
  fieldType: f.array(z.string())
})

// Array with custom item validation
const emails = field({
  fieldType: f.array(z.string().email())
})

// Array with constraints
const limitedTags = field({
  fieldType: f.array(z.string(), { min: 1, max: 10 })
})
```

## Options

- `min` - Minimum number of items
- `max` - Maximum number of items
- `unique` - Ensure no duplicate items

## Implementation

```typescript
import { json } from '@deessejs/collections'

// Factory function accepting any Zod schema
const array = (itemSchema: z.ZodTypeAny, options?: ArrayOptions) => fieldType({
  type: 'array',
  columnType: json(),
  schema: z.array(itemSchema),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    unique: z.boolean().optional()
  })
})
```

The `json()` function returns `'jsonb'` (the SQL column type).
