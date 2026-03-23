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

// Decimal for financial data
const price = field({
  fieldType: f.number({ precision: 10, scale: 2 })
})
```

## Options

- `min` - Minimum value
- `max` - Maximum value
- `precision` - Total number of digits
- `scale` - Digits after decimal point

## Implementation

```typescript
const number = fieldType({
  type: 'number',
  columnType: options?.precision
    ? `numeric(${options.precision}, ${options.scale ?? 0})`
    : 'decimal',
  schema: z.number(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional()
  })
})
```

## Validation Flow

When a user creates a record:

1. **Base validation** (always applied):
   ```typescript
   db.users.create({ data: { age: "wow" } })
   // Error: age must be a number (base schema z.number())
   ```

2. **User constraint validation** (if options defined):
   ```typescript
   db.users.create({ data: { age: -4 } })
   // Error: age must be >= 0 (user-defined constraint)
   ```

## Type Definition

```typescript
type NumberOptions = {
  min?: number
  max?: number
  precision?: number
  scale?: number
}
```
