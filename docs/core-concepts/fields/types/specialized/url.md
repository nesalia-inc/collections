# URL

```typescript
import { field, f } from '@deessejs/collections'

const website = field({
  fieldType: f.url()
})
```

Includes built-in URL validation.

## Implementation

```typescript
const url = (): FieldType =>
  fieldType({
    type: 'url',
    columnType: 'varchar(2048)',
    schema: z.string().url()
  })
```
