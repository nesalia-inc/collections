# Rich Text

For HTML or Markdown content:

```typescript
import { field, f } from '@deessejs/collections'

const content = field({
  fieldType: f.richtext()
})
```

## Implementation

```typescript
const richtext = fieldType({
  type: 'richtext',
  columnType: 'text',
  schema: z.string(),
  validation: z.object({})
})
```

## Validation Flow

1. **Base validation**:
   ```typescript
   db.posts.create({ data: { content: 123 } })
   // Error: content must be a string
   ```
