# Email

```typescript
import { field, f } from '@deessejs/collections'

const email = field({
  fieldType: f.email()
})
```

Includes built-in email validation with automatic lowercase transform.

## Implementation

```typescript
const email = fieldType({
  type: 'email',
  columnType: 'varchar(255)',
  schema: z.string().email(),
  options: {
    transform: (value) => value?.toLowerCase().trim()
  }
})
```
