# Database Module

Type-safe database access for collections.

## Public API

```typescript
import { DbAccess, CollectionDbMethods, defineConfig } from '@deessejs/collections'
```

## Usage

```typescript
import { defineConfig } from '@deessejs/collections'
import { posts } from '@/collections/posts'

const config = defineConfig({
  collections: [posts],
})

// Access by slug
config.db.posts.findMany()
config.db.posts.findUnique({ where: { id: '123' } })
config.db.posts.create({ data: { title: 'Hello' } })
config.db.posts.update({ where: { id: '123' }, data: { title: 'World' } })
config.db.posts.delete({ where: { id: '123' } })
config.db.posts.count()
config.db.posts.exists({ where: { title: 'Hello' } })
```

## Types

| Type | Description |
|------|-------------|
| `DbAccess<T>` | Maps collection array to db methods object |
| `CollectionDbMethods<T>` | Database operation methods for a collection |
| `FindManyQuery<TData>` | Query options for findMany |
| `WhereById` | Where clause using id |

## Files

- `index.ts` - Module exports
- `types.ts` - Type definitions
