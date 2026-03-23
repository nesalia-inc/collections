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
  schema: z.string().optional(),
  validation: z.object({})
})

const fileMultiple = fieldType({
  type: 'file',
  columnType: 'text',
  schema: z.array(z.string()),
  validation: z.object({})
})
```

## Validation Flow

1. **Base validation**:
   ```typescript
   db.users.create({ data: { avatar: 123 } })
   // Error: avatar must be a string
   ```
