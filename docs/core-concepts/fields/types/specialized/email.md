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
  columnType: 'varchar(255)',
  schema: z.string().email(),
  transform: (value) => value?.toLowerCase().trim(),
  validation: z.object({})
})
```

## Validation Flow

1. **Transform** (trim + lowercase):
   Applied before validation to normalize the input.

2. **Base validation**:
   ```typescript
   db.users.create({ data: { email: "not-an-email" } })
   // Error: email must be a valid email address
   ```

## Query Behavior

Searches on this field are case-insensitive thanks to the automatic transform:
```typescript
db.users.find({
  where: (u) => u.email.eq("USER@Example.com")
})
// Matches "user@example.com" in database
```
