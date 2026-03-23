# Number

```typescript
import { field, f } from '@deessejs/collections'

const age = field({
  fieldType: f.number()
})

// With min/max validation
const rating = field({
  fieldType: f.number({ min: 1, max: 5 })
})

// Integer only
const quantity = field({
  fieldType: f.integer()
})

// Integer with range
const level = field({
  fieldType: f.integer({ min: 1, max: 100 })
})
```

## Options

- `min` - Minimum value
- `max` - Maximum value

## Implementation

```typescript
import { integer } from '@deessejs/collections'

const number = fieldType({
  type: 'number',
  columnType: decimal(),
  schema: z.number(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  })
})

const integer = fieldType({
  type: 'integer',
  columnType: integer(),
  schema: z.number().int(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  })
})
```

The `integer()` function returns `'integer'`. The `decimal()` function returns `'decimal'`.
