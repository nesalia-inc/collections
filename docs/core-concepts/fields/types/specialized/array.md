# Array

```typescript
import { field, f, z } from '@deessejs/collections'

const tags = field({
  fieldType: f.array(z.string())
})

const scores = field({
  fieldType: f.array(z.number())
})
```
