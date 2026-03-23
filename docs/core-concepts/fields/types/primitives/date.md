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
