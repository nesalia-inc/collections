<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="public/icon.png">
    <source media="(prefers-color-scheme: light)" srcset="public/icon.png">
    <img src="public/icon.png" alt="collections" width="150" height="150" style="border-radius: 50%;">
  </picture>
</p>

<h1 align="center">@deessejs/collections</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@deessejs/collections">
    <img src="https://img.shields.io/npm/v/@deessejs/collections" alt="npm Version">
  </a>
  <a href="https://www.npmjs.com/package/@deessejs/collections">
    <img src="https://img.shields.io/bundlejs/size/@deessejs/collections" alt="Bundle Size">
  </a>
  <a href="https://github.com/nesalia-inc/collections/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/nesalia-inc/collections/test?label=tests" alt="Tests">
  </a>
  <a href="https://github.com/nesalia-inc/collections/actions">
    <img src="https://img.shields.io/badge/coverage-100%25-brightgreen" alt="Coverage">
  </a>
  <a href="https://github.com/nesalia-inc/collections/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/nesalia-inc/collections" alt="License">
  </a>
</p>

> A functional-first collection and data modeling layer built on Drizzle ORM.

## Requirements

- TypeScript 5.0+
- Drizzle ORM

## Installation

```bash
# Install collections
npm install @deessejs/collections

# Or using pnpm
pnpm add @deessejs/collections

# Or using yarn
yarn add @deessejs/collections
```

## Quick Start

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
config.$meta.collections          // ['users', 'posts']
```

## Field Types

```typescript
import { f } from '@deessejs/collections'

// Primitive types
f.text()           // Text/string
f.email()          // Email (with validation)
f.url()            // URL (with validation)
f.number()         // Number
f.boolean()        // Boolean
f.date()          // Date
f.timestamp()      // Timestamp
f.json()          // JSON

// Complex types
f.select(['draft', 'published'])  // Enum
f.array(f.text())                // Array
f.relation({ collection: 'users' }) // Relations
```

## Hooks

Execute custom logic at each stage of database operations:

```typescript
const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() }),
    email: field({ fieldType: f.text() })
  },
  hooks: {
    beforeCreate: [async (context) => {
      // Validate or transform data before creating
      context.data.email = context.data.email.toLowerCase()
    }],
    afterCreate: [async (context) => {
      // Handle post-creation logic
      console.log(`Created user: ${context.result.id}`)
    }]
  }
})
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `beforeOperation` | Runs before any operation |
| `afterOperation` | Runs after any operation |
| `beforeCreate` | Runs before create operation |
| `afterCreate` | Runs after create operation |
| `beforeUpdate` | Runs before update operation |
| `afterUpdate` | Runs after update operation |
| `beforeDelete` | Runs before delete operation |
| `afterDelete` | Runs after delete operation |
| `beforeRead` | Runs before read operation |
| `afterRead` | Runs after read operation |

## Current Status

- **Collection system** - Implemented
- **Field types** - Implemented
- **Hooks** - Implemented
- **Plugins** - Implemented
- **Schema generation** - Implemented
- **CRUD via db** - Implemented
- **Full CRUD via collections.*** - In progress

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

- **Nesalia Inc.**

## Security

If you discover any security vulnerabilities, please send an e-mail to security@nesalia.com.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
