# File

For file uploads (stores file reference/path):

```typescript
import { field, f } from '@deessejs/collections'

const avatar = field({
  fieldType: f.file()
})

const attachments = field({
  fieldType: f.file({ multiple: true })
})
```

## Options

- `multiple` - Allow multiple files
