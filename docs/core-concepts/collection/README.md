# Collections

Collections are the main organizational unit in Collections. They define a group of related data with fields, hooks, permissions, and relationships.

## Overview

```typescript
import { collection, field, f } from '@deessejs/collections'

export const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() }),
    author: field({ fieldType: f.relation({ to: 'users' }) })
  }
})
```

## Documents

- [Definition](./definition.md) - How to define a collection
- [Structure](./structure.md) - CollectionConfig type reference
- [Fields](./fields.md) - Field definitions
- [Hooks](./hooks.md) - Lifecycle hooks
- [Permissions](./permissions.md) - Access control
- [Indexes](./indexes.md) - Database indexes
- [Relations](./relations.md) - Collection relationships
- [Extend](./extend.md) - Collection-level methods
- [Methods](./methods.md) - Instance methods on records
- [Usage](./usage.md) - Using collections in defineConfig

## Key Features

| Feature | Description |
|---------|-------------|
| Fields | Define data structure |
| Hooks | Lifecycle callbacks |
| Permissions | Access control |
| Indexes | Query performance |
| Relations | Link collections |
| Extend | Custom collection methods |
| Methods | Instance methods on records |

## Quick Example

```typescript
const tasks = collection({
  slug: 'tasks',
  fields: {
    title: field({ fieldType: f.text() }),
    completed: field({ fieldType: f.boolean() })
  },

  // Custom methods
  extend: {
    complete: async ({ id }, { db }) => {
      await db.tasks.update({
        where: { id },
        data: { completed: true }
      })
    }
  },

  methods: {
    complete: async (task) => {
      await db.tasks.update({
        where: { id: task.id },
        data: { completed: true }
      })
    }
  }
})
```
