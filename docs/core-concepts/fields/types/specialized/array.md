# Array

```typescript
import { field, f, z } from '@deessejs/collections'

// Basic array with item type
const tags = field({
  fieldType: f.array(z.string())
})

// Custom validation on array items
const emails = field({
  fieldType: f.array(z.string().email())
})

// Custom validation schema
const users = field({
  fieldType: f.array(z.object({
    name: z.string(),
    age: z.number()
  }))
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

const arrayCustomItem = fieldType({
  type: 'array',
  columnType: 'jsonb',
  schema: z.array(z.string().email()),
  validation: z.object({})
})

const arrayWithSchema = fieldType({
  type: 'array',
  columnType: 'jsonb',
  schema: z.array(z.object({
    name: z.string(),
    age: z.number()
  })),
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

3. **Custom schema validation**:
   ```typescript
   db.users.create({ data: { users: [{ name: "John", age: "invalid" }] } })
   // Error: users[0].age must be a number
   ```
