# Collections

Collections are the main organizational unit in Collections. They define a group of related data with fields, hooks, and relationships.

## Defining a Collection

```typescript
import { collection, field, f } from '@deessejs/collections'

export const posts = collection({
  slug: 'posts',

  // Optional: human-readable name
  name: 'Posts',

  // Optional: admin configuration
  admin: {
    description: 'Blog posts and articles'
  },

  // Optional: permissions
  permissions: {
    create: async ({ user }) => !!user,
    read: async ({ user }) => true,
    update: async ({ user, current }) => user?.role === 'admin' || current.authorId === user?.id,
    delete: async ({ user, current }) => user?.role === 'admin'
  },

  // Collection fields
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    author: field({ fieldType: f.relation({ to: 'users' }) })
  }
})
```

## Collection Structure

```typescript
type CollectionConfig<
  TSlug extends string,
  TFields extends Record<string, FieldDefinition>
> = {
  // Required: unique identifier
  slug: TSlug

  // Optional: human-readable name for UI
  name?: string

  // Optional: admin configuration
  admin?: {
    // Field description for admin UI
    description?: string
  }

  // Optional: permissions for CRUD operations
  permissions?: {
    // Permission to create records
    create?: (context: { user?: User; data: unknown }) => Promise<boolean> | boolean,
    // Permission to read records
    read?: (context: { user?: User; query: unknown }) => Promise<boolean> | boolean,
    // Permission to update records
    update?: (context: { user?: User; data: unknown; current: unknown }) => Promise<boolean> | boolean,
    // Permission to delete records
    delete?: (context: { user?: User; current: unknown }) => Promise<boolean> | boolean
  }

  // Required: field definitions
  fields: TFields

  // Optional: lifecycle hooks
  hooks?: HooksConfig

  // Optional: database indexes
  indexes?: IndexConfig[]

  // Optional: relations to other collections
  relations?: RelationConfig[]
}
```

## Fields

Fields define the structure of your data. See [Fields](./fields.md) for details.

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    // Simple field
    title: field({ fieldType: f.text() }),

    // Field with options
    slug: field({ fieldType: f.text(), maxLength: 255, unique: true }),

    // Field with default
    status: field({ fieldType: f.text(), defaultValue: 'draft' }),

    // Relation field
    author: field({ fieldType: f.relation({ to: 'users' }) })
  }
})
```

## Hooks

Hooks allow you to run code at different points in the data lifecycle. See [Hooks](../production/hooks.md) for details.

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  },

  hooks: {
    // Before creating a record
    beforeCreate: [
      async ({ data }) => {
        // Transform data
        return {
          ...data,
          title: data.title.trim(),
          createdAt: new Date()
        }
      }
    ],

    // After creating a record
    afterCreate: [
      async ({ result }) => {
        // Send notifications, etc.
        await sendNotification(result.id)
      }
    ],

    // Before updating
    beforeUpdate: [
      async ({ data, previousData }) => {
        // Validate or transform
        return data
      }
    ],

    // After reading
    afterRead: [
      async ({ result }) => {
        // Transform output
        return result.map(post => ({
          ...post,
          title: post.title.toUpperCase()
        }))
      }
    ]
  }
})
```

## Permissions

Define access control for each operation:

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    authorId: field({ fieldType: f.text() })
  },

  permissions: {
    // Anyone can create
    create: async ({ user }) => !!user,

    // Everyone can read
    read: async () => true,

    // Only author or admin can update
    update: async ({ user, current }) => {
      if (!user) return false
      return user.role === 'admin' || current.authorId === user.id
    },

    // Only admin can delete
    delete: async ({ user }) => user?.role === 'admin'
  }
})
```

### Read Permissions with Query Constraints

The `read` permission can return query constraints instead of just a boolean. This injects filters directly into the SQL WHERE clause:

```typescript
permissions: {
  // Boolean: allow all
  read: async () => true,

  // Query constraints: filter results
  read: async ({ user }) => {
    if (!user) return { published: true }  // Public sees only published
    if (user.role === 'admin') return true  // Admin sees all

    // Return constraints injected into WHERE
    return {
      OR: [
        { authorId: user.id },
        { published: true }
      ]
    }
  }
}
```

**Why Query Constraints?**
- Boolean permissions reject entire queries for unauthorized users
- Query constraints filter results at the database level (efficient)
- Works with millions of records without performance issues

```typescript
// Without constraints: query fails if user has no permission
// With constraints: SELECT * WHERE authorId = 'user-123'
```

### Permission Context

Each permission function receives a context object:

```typescript
permissions: {
  create: async ({ user, data }) => {
    // user: Current authenticated user (from session)
    // data: The data being created
    return user?.role === 'admin'
  },

  read: async ({ user, query }) => {
    // user: Current authenticated user
    // query: The query parameters
    return user?.role !== 'banned'
  },

  update: async ({ user, data, current }) => {
    // user: Current authenticated user
    // data: New data being set
    // current: Existing record
    return user?.role === 'admin' || current.ownerId === user?.id
  },

  delete: async ({ user, current }) => {
    // user: Current authenticated user
    // current: Record being deleted
    return user?.role === 'admin'
  }
}
```

### Permission with Hooks

Combine with hooks for complex logic:

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    status: field({ fieldType: f.select(['draft', 'published']) }),
    authorId: field({ fieldType: f.text() })
  },

  permissions: {
    read: async ({ user }) => true,
    update: async ({ user, current }) => user?.role === 'admin' || current.authorId === user?.id
  },

  hooks: {
    beforeCreate: [
      async ({ data, db }) => {
        // Add author from session
        const session = await db.session()
        data.authorId = session.user.id

        // Auto-set draft for non-admins
        if (session.user.role !== 'admin') {
          data.status = 'draft'
        }

        return data
      }
    ]
  }
})
```

## Indexes

Define database indexes for performance:

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    createdAt: field({ fieldType: f.timestamp() })
  },

  indexes: [
    // Single field index
    { fields: ['published'] },

    // Composite index
    { fields: ['published', 'createdAt'] },

    // Unique index
    { fields: ['slug'], unique: true }
  ]
})
```

## Relations

Define relationships to other collections using `f.relation()`:

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    author: field({ fieldType: f.relation({ to: 'users' }) })
  }
})

export const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() })
  }
})
```

**Note:** The relation defined in `fields` creates the foreign key column. For complex relations (many-to-many with junction table), additional configuration may be needed via the `relations` property.

## Auto-Generated Fields

Every collection automatically gets these fields:

```typescript
type Post = GetCollectionType<typeof posts>
// {
//   id: string          // Auto-generated UUID
//   createdAt: Date     // Auto-set on create
//   updatedAt: Date     // Auto-set on update
//   title: string       // Your custom fields
//   ...
// }
```

These fields are added automatically and can be configured:

```typescript
export const posts = collection({
  slug: 'posts',

  // Configure auto-generated fields
  id: {
    type: 'uuid',       // 'uuid' | 'string' | 'number'
    autoGenerate: true
  },

  createdAt: {
    fieldName: 'created_at',  // Rename field
    autoSet: true
  },

  updatedAt: {
    fieldName: 'updated_at',  // Rename field
    autoSet: true,
    onUpdate: true           // Auto-update on changes
  },

  fields: {
    title: field({ fieldType: f.text() })
  }
})
```

**Options:**
- `type` - ID type: `'uuid'`, `'string'`, or `'number'`
- `autoGenerate` - Auto-generate on create (for id)
- `fieldName` - Customize column name
- `autoSet` - Auto-set on create (for timestamps)
- `onUpdate` - Auto-update on changes (for timestamps)

### Disable auto fields

For immutable tables (like logs), disable auto timestamps:

```typescript
const auditLogs = collection({
  slug: 'audit_logs',

  updatedAt: false,  // Disable auto-updatedAt

  fields: {
    action: field({ fieldType: f.text() }),
    timestamp: field({ fieldType: f.timestamp() })
  }
})
```

## Using Collections

Once defined, collections are used in `defineConfig`:

```typescript
import { defineConfig, pgAdapter } from '@deessejs/collections'

const posts = collection({ /* ... */ })
const users = collection({ /* ... */ })

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL }),
  collections: [posts, users]
})
```

## Collection API

The config provides a typed API for each collection:

```typescript
// The config provides typed CRUD operations
const { posts, users } = config.collections

// Create
const post = await posts.create({
  title: 'Hello World',
  content: 'My first post',
  author: user.id
})

// Find one
const found = await posts.find(post.id)

// Find many
const all = await posts.findMany({
  where: { published: true },
  orderBy: { createdAt: 'desc' },
  limit: 10
})

// Update
const updated = await posts.update(post.id, {
  title: 'Updated Title'
})

// Delete
await posts.delete(post.id)
```

## TypeScript Inference

Collections automatically infer TypeScript types:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    count: field({ fieldType: f.number() })
  }
})

// Automatically inferred!
type Post = GetCollectionType<typeof posts>
// {
//   id: string
//   title: string
//   published: boolean
//   count: number
//   createdAt: Date
//   updatedAt: Date
// }
```

## Best Practices

1. **Use descriptive slugs**: `'posts'`, `'user-profiles'`
2. **Define hooks for business logic**: Keep controllers clean
3. **Use indexes for queries**: Add indexes for fields you filter/sort by
4. **Keep collections focused**: One collection per logical entity
5. **Define relations explicitly**: Use the relations config for clarity