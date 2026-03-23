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
  columnType: 'decimal',
  schema: z.number()
})

const numberMin = fieldType({
  type: 'number',
  columnType: 'decimal',
  schema: z.number().min(1)
})

const numberMax = fieldType({
  type: 'number',
  columnType: 'decimal',
  schema: z.number().max(100)
})

const numberMinMax = fieldType({
  type: 'number',
  columnType: 'decimal',
  schema: z.number().min(1).max(100)
})

const decimal = fieldType({
  type: 'number',
  columnType: 'numeric(10, 2)',
  schema: z.number()
})
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
