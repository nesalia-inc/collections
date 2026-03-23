# Select

```typescript
import { field, f } from '@deessejs/collections'

const status = field({
  fieldType: f.select(['draft', 'published', 'archived'])
})
```

Creates an enum field with predefined options.

## Options

- `label` - Display label for UI (future feature)

## Implementation

```typescript
// Factory function accepting any string array
const select = <T extends string>(options: [T, ...T[]]) => {
  const maxLength = Math.max(...options.map(o => o.length))
  return fieldType({
    type: 'select',
    columnType: `varchar(${maxLength})`,
    schema: z.enum(options),
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
