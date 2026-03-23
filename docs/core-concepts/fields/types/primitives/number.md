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
// Base field type - validates that the value is a number
const number = fieldType({
  type: 'number',
  columnType: 'decimal',
  schema: z.number()
})

// With minimum constraint
const numberMin = fieldType({
  type: 'number',
  columnType: 'decimal',
  schema: z.number(),
  validation: {
    min: (value) => value >= 0
  }
})

// With maximum constraint
const numberMax = fieldType({
  type: 'number',
  columnType: 'decimal',
  schema: z.number(),
  validation: {
    max: (value) => value <= 100
  }
})

// With min and max constraints
const numberMinMax = fieldType({
  type: 'number',
  columnType: 'decimal',
  schema: z.number(),
  validation: {
    min: (value) => value >= 1,
    max: (value) => value <= 100
  }
})

// Decimal with precision/scale
const decimal = fieldType({
  type: 'number',
  columnType: 'numeric(10, 2)',
  schema: z.number()
})
```

## Validation Flow

When a user creates a record:

1. **Base validation** (always applied):
   ```typescript
   db.users.create({ data: { age: "wow" } })
   // Error: age must be a number (base schema z.number())
   ```

2. **User constraint validation** (if defined):
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

type FieldTypeConfig<T> = {
  type: string
  columnType: string
  schema: T
  validation?: {
    min?: (value: number) => boolean
    max?: (value: number) => boolean
  }
  transform?: (value: unknown) => unknown
  prepare?: (value: unknown) => unknown
}
```
