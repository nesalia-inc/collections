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
const richtext = (): FieldType =>
  fieldType({
    type: 'richtext',
    columnType: 'text',
    schema: z.string()
  })
```
