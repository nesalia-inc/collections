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

## ID Types

| Type | Generation | Use Case |
|------|------------|----------|
| `uuid` | ORM generates UUIDv7 (recommended) | Distributed systems, best index performance |
| `number` | Database auto-increment | Simple apps, small scale |
| `string` | Custom or auto-generate | Legacy databases |

```typescript
const posts = collection({
  slug: 'posts',

  // Configure ID type
  id: {
    type: 'uuid',       // 'uuid' | 'number' | 'string'
    autoGenerate: true
  },

  fields: {
    title: field({ fieldType: f.text() })
  }
})
```

## Timestamps

```typescript
const posts = collection({
  slug: 'posts',

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

## Soft Delete

Enable automatic soft delete filtering:

```typescript
const users = collection({
  slug: 'users',
  softDelete: true,

  fields: {
    name: field({ fieldType: f.text() })
  }
})

// Automatically excludes deleted records
const activeUsers = db.users.findMany()

// Include deleted records when needed
const allUsers = db.users.findMany({ withDeleted: true })
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
