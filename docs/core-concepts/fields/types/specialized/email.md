# Email

```typescript
import { field, f } from '@deessejs/collections'

const email = field({
  fieldType: f.email()
})
```

Includes built-in email validation with automatic lowercase transform.
