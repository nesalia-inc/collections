# Date

```typescript
import { field, f } from '@deessejs/collections'

const birthDate = field({
  fieldType: f.date()
})

const createdAt = field({
  fieldType: f.timestamp()
})

// With min/max validation
const recentDate = field({
  fieldType: f.date({ min: new Date('2020-01-01') })
})

// With timestamp range
const lastWeek = field({
  fieldType: f.timestamp({
    min: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    max: new Date()
  })
})
```

## Types

- `f.date()` - Date only (no time)
- `f.timestamp()` - Date with time

## Implementation

```typescript
const date = fieldType({
  type: 'date',
  columnType: date(),
  schema: z.union([
    z.date(),
    z.string().datetime()
  ]),
  validation: z.object({
    min: z.date().optional(),
    max: z.date().optional()
  })
})

const timestamp = fieldType({
  type: 'timestamp',
  columnType: timestamp(),
  schema: z.union([
    z.date(),
    z.string().datetime()
  ]),
  validation: z.object({
    min: z.date().optional(),
    max: z.date().optional()
  })
})
```

The `date()` function returns `'date'`. The `timestamp()` function returns `'timestamp'`.
