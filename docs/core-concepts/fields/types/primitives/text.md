# Text

```typescript
import { field, f } from '@deessejs/collections'

const name = field({
  fieldType: f.text()
})

// With options
const title = field({
  fieldType: f.text({ minLength: 1, maxLength: 100 })
})
```

## Options

- `minLength` - Minimum string length
- `maxLength` - Maximum string length
- `pattern` - Regex pattern for validation
