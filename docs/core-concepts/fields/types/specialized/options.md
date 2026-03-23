# Options

```typescript
import { field, f } from '@deessejs/collections'

// String options
const status = field({
  fieldType: f.options(['draft', 'published', 'archived'])
})

// Number options
const priority = field({
  fieldType: f.options([1, 2, 3])
})

// Mixed options
const code = field({
  fieldType: f.options(['A', 'B', 'C'] as const)
})
```

Creates a field with predefined options of any type using union of literals.

## Implementation

```typescript
// Factory function accepting any array of values
const options = <T extends readonly [T, ...T[]]>(options: T) => {
  const first = options[0]
  const columnType = typeof first === 'number' ? 'integer' : 'varchar(50)'
  const schema = z.union(options.map(opt => z.literal(opt)))
  return fieldType({
    type: 'options',
    columnType,
    schema,
    validation: z.object({})
  })
}
```

## Validation Flow

1. **Base validation**:
   ```typescript
   db.posts.create({ data: { status: "invalid" } })
   // Error: status must be one of: draft, published, archived
   ```

2. **Type validation**:
   ```typescript
   db.posts.create({ data: { priority: "high" } })
   // Error: priority must be 1, 2, or 3
   ```
