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
