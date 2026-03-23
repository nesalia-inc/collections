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
  transform: (value) => value?.toLowerCase().trim(),
  validation: z.object({})
})
```

## Validation Flow

1. **Base validation**:
   ```typescript
   db.users.create({ data: { email: "not-an-email" } })
   // Error: email must be a valid email address
   ```
