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
const file = fieldType({
  type: 'file',
  columnType: 'varchar(500)',
  schema: z.string().optional()
})

const fileMultiple = fieldType({
  type: 'file',
  columnType: 'text',
  schema: z.array(z.string())
})
```

## Type Definition

```typescript
type FileOptions = {
  multiple?: boolean
}
```
