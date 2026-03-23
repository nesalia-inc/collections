# Boolean

```typescript
import { field, f } from '@deessejs/collections'

const published = field({
  fieldType: f.boolean()
})
```

## Implementation

```typescript
const boolean = fieldType({
  type: 'boolean',
  columnType: boolean(),
  schema: z.boolean()
})
```

The `boolean()` function returns `'boolean'` (the SQL column type).
