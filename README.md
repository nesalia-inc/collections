# @deessejs/collections

A functional-first collection and data modeling layer built on Drizzle ORM.

## Developer Experience

### Type-Safe Collection Access

Collections are inferred from your configuration, providing full autocompletion for metadata:

```typescript
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [users, posts]
})

// Metadata access (autocomplete)
config.collections.users.slug    // 'users'
config.collections.users.fields  // { name, email, ... }
config.$meta.collections        // ['users', 'posts']
```

### Database Operations

All CRUD operations are available through the Drizzle instance:

```typescript
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [users, posts]
})

// Access Drizzle db
const { db } = config

// Drizzle operations
const allUsers = await db.users.findMany()
const newUser = await db.users.insert({ name: 'John', email: 'john@example.com' })
const updatedUser = await db.users.update({ where: { id: 1 }, data: { name: 'Jane' } })
await db.users.delete({ where: { id: 1 } })
```

### Metadata Access

Collection metadata is available through `$meta`:

```typescript
// $meta.collections gives you all collection slugs
config.$meta.collections // ['users', 'posts']

// $meta.plugins gives you loaded plugin names
config.$meta.plugins // ['timestamps', 'soft-delete']
```

## Quick Start

```bash
pnpm install @deessejs/collections
```

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'

// Define collections
const users = collection({
  slug: 'users',
  name: 'Users',
  fields: {
    name: field({ fieldType: f.text() }),
    email: field({ fieldType: f.email(), unique: true }),
    age: field({ fieldType: f.number() })
  }
})

const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})

// Create configuration
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [users, posts]
})

// Access metadata
console.log(config.collections.users.slug) // 'users'

// Access Drizzle db for operations
const { db } = config
```

## Features

- **Type-safe** - Full TypeScript inference for collections and operations
- **Functional** - Clean, composable API
- **Plugin system** - Extend with hooks and custom collections
- **Drizzle-based** - Built on top of Drizzle ORM
- **Schema generation** - Auto-generate Drizzle schema from collections

## Field Types

```typescript
import { f } from '@deessejs/collections'

// Primitive types
f.text()           // Text/string
f.email()          // Email (with validation)
f.url()            // URL (with validation)
f.number()         // Number
f.boolean()        // Boolean
f.date()           // Date
f.timestamp()      // Timestamp
f.json()           // JSON

// Complex types
f.select(['draft', 'published'])  // Enum
f.array(f.text())                  // Array
f.relation({ collection: 'users' }) // Relations
```

## Current Status

- **Collection system** - Implemented
- **Field types** - Implemented
- **Hooks** - Implemented
- **Plugins** - Implemented
- **Schema generation** - Implemented
- **CRUD via db** - Implemented
- **Full CRUD via collections.*** - Not implemented (use `config.db` instead)
