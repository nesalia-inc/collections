# Select

```typescript
import { field, f } from '@deessejs/collections'

const status = field({
  fieldType: f.select(['draft', 'published', 'archived'])
})
```

Creates an enum field with predefined options.

## Implementation

```typescript
const select = fieldType({
  type: 'select',
  columnType: 'varchar(50)',
  schema: z.enum(['draft', 'published', 'archived'])
})
```
