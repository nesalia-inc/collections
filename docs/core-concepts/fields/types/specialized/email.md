# Email

```typescript
import { field, f } from '@deessejs/collections'

const email = field({
  fieldType: f.email()
})
```

Includes built-in email validation with automatic lowercase and trim transform.

## Implementation

```typescript
const email = fieldType({
  type: 'email',
  columnType: email(),
  schema: z.string().email(),
  transform: (value) => value?.toLowerCase().trim(),
  validation: z.object({})
})
```

The `email()` function returns `'email'` (the SQL column type).
