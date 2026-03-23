# Auto-Generated Fields

Every collection automatically includes these fields:

- `id` - Unique identifier (auto-generated UUID)
- `createdAt` - Timestamp when record was created
- `updatedAt` - Timestamp when record was last updated

```typescript
type Post = GetCollectionType<typeof posts>
// {
//   id: string
//   createdAt: Date
//   updatedAt: Date
//   ... your custom fields
// }
```

## Configuration

Auto-generated fields can be configured per collection:

```typescript
const posts = collection({
  slug: 'posts',

  // Configure ID
  id: {
    type: 'uuid',       // 'uuid' | 'string' | 'number'
    autoGenerate: true
  },

  // Configure timestamps
  createdAt: {
    fieldName: 'created_at',
    autoSet: true
  },

  updatedAt: {
    fieldName: 'updated_at',
    autoSet: true,
    onUpdate: true
  },

  fields: {
    title: field({ fieldType: f.text() })
  }
})
```

## Disable Fields

For immutable tables (logs), disable auto timestamps:

```typescript
const logs = collection({
  slug: 'logs',
  updatedAt: false,  // Disable auto-updatedAt

  fields: {
    action: field({ fieldType: f.text() }),
    timestamp: field({ fieldType: f.timestamp() })
  }
})
```
