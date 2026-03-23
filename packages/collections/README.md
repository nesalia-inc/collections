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

> High-level abstraction layer built on top of Drizzle ORM.

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
import { collection, field, f } from '@deessejs/collections'

// Define a collection
const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() }),
    email: field({ fieldType: f.text() })
  }
})
```

## Features

- **Collection API** - Define database collections with a clean API
- **Hooks System** - Lifecycle hooks for all CRUD operations
- **Type Safety** - Full TypeScript support with inferred types
- **Drizzle Integration** - Built on top of Drizzle ORM

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

## Field Types

```typescript
import { f } from '@deessejs/collections'

// Text field
field({ fieldType: f.text() })

// Number field
field({ fieldType: f.number() })

// Boolean field
field({ fieldType: f.boolean() })

// UUID field
field({ fieldType: f.uuid() })

// Timestamp field
field({ fieldType: f.timestamp() })
```

## API Reference

### collection()

Create a new collection definition.

```typescript
const users = collection({
  slug: 'users',
  name: 'Users',
  fields: {
    name: field({ fieldType: f.text() })
  },
  hooks: {
    beforeCreate: [async (ctx) => { /* ... */ }]
  }
})
```

### field()

Define a field in a collection.

```typescript
const name = field({
  fieldType: f.text(),
  optional: false,
  default: 'default value'
})
```

### createCollectionOperations()

Create CRUD operations for a collection.

```typescript
import { createCollectionOperations } from '@deessejs/collections'

const operations = createCollectionOperations(
  collection,
  tableName,
  db,
  table,
  hooks
)

// Create
await operations.create({ data: { name: 'John' } })

// Read
await operations.findMany()

// Update
await operations.update({ where: { id: 1 }, data: { name: 'Jane' } })

// Delete
await operations.delete({ where: { id: 1 } })
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

- **Nesalia Inc.**

## Security

If you discover any security vulnerabilities, please send an e-mail to security@nesalia.com.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
