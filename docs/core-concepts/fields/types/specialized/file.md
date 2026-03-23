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

## Implementation

```typescript
const file = (options?: FileOptions): FieldType =>
  fieldType({
    type: 'file',
    columnType: options?.multiple ? 'text' : 'varchar(500)',
    schema: options?.multiple ? z.array(z.string()) : z.string().optional()
  })

type FileOptions = {
  multiple?: boolean
}
```
