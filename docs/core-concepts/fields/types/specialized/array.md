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
  schema: z.array(z.string())
})

const arrayNumber = fieldType({
  type: 'array',
  columnType: 'jsonb',
  schema: z.array(z.number())
})
```
