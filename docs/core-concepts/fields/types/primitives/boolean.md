# Boolean

```typescript
import { field, f } from '@deessejs/collections'

const published = field({
  fieldType: f.boolean()
})
```

## Implementation

```typescript
const boolean = (): FieldType =>
  fieldType({
    type: 'boolean',
    columnType: 'boolean',
    schema: z.boolean()
  })
```
