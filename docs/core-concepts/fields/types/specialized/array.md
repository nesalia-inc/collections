# Array

```typescript
import { field, f, z } from '@deessejs/collections'

const tags = field({
  fieldType: f.array(z.string())
})

const scores = field({
  fieldType: f.array(z.number())
})
```

## Implementation

```typescript
const array = fieldType({
  type: 'array',
  columnType: 'jsonb',
  schema: z.array(z.string()),
  validation: z.object({})
})

const arrayNumber = fieldType({
  type: 'array',
  columnType: 'jsonb',
  schema: z.array(z.number()),
  validation: z.object({})
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
