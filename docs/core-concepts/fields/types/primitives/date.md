# Date

```typescript
import { field, f } from '@deessejs/collections'

const birthDate = field({
  fieldType: f.date()
})

const createdAt = field({
  fieldType: f.timestamp()
})
```

## Types

- `f.date()` - Date only (no time)
- `f.timestamp()` - Date with time

## Implementation

```typescript
const date = fieldType({
  type: 'date',
  columnType: 'date',
  schema: z.date()
})

const timestamp = fieldType({
  type: 'timestamp',
  columnType: 'timestamp',
  schema: z.date()
})
```
