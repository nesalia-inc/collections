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
// Factory function accepting any Zod schema
const array = (itemSchema: z.ZodTypeAny, options?: ArrayOptions) => fieldType({
  type: 'array',
  columnType: 'jsonb',
  schema: z.array(itemSchema),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    unique: z.boolean().optional()
  })
})
```

## Validation Flow

1. **Base validation**:
   ```typescript
   db.posts.create({ data: { tags: "not-array" } })
   // Error: tags must be an array
   ```

2. **Item validation**:
   ```typescript
   db.posts.create({ data: { tags: [1, 2, 3] } })
   // Error: tags must contain only strings
   ```

3. **Constraints validation**:
   ```typescript
   db.posts.create({ data: { tags: [] } })
   // Error: tags must have at least 1 item
   ```
