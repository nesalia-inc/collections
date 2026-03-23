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
  schema: z.date(),
  validation: z.object({
    min: z.date().optional(),
    max: z.date().optional()
  })
})

const timestamp = fieldType({
  type: 'timestamp',
  columnType: 'timestamp',
  schema: z.date(),
  validation: z.object({
    min: z.date().optional(),
    max: z.date().optional()
  })
})
```

## Validation Flow

1. **Base validation**:
   ```typescript
   db.users.create({ data: { birthDate: "not a date" } })
   // Error: birthDate must be a date
   ```

2. **User constraint validation**:
   ```typescript
   db.users.create({ data: { birthDate: new Date('2000-01-01') } })
   // Error: birthDate must be after 2000-01-01
   ```

