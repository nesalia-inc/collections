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
  schema: options?.min !== undefined || options?.max !== undefined
    ? z.number().min(options?.min ?? -Infinity).max(options?.max ?? Infinity)
    : z.number()
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
