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
import { varchar } from '@deessejs/collections'

// Factory function accepting any string array
const select = <T extends string>(options: [T, ...T[]]) => {
  const maxLength = Math.max(...options.map(o => o.length))
  return fieldType({
    type: 'select',
    columnType: varchar(maxLength),
    schema: z.enum(options),
    validation: z.object({})
  })
}
```

The `varchar(maxLength)` function returns a `'varchar'` SQL column type.
