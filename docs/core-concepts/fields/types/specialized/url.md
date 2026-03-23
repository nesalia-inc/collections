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
const url = fieldType({
  type: 'url',
  columnType: 'varchar(2048)',
  schema: z.string().url(),
  validation: z.object({})
})
```

## Validation Flow

1. **Base validation**:
   ```typescript
   db.users.create({ data: { website: "not-a-url" } })
   // Error: website must be a valid URL
   ```
