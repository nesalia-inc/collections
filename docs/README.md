# @deessejs/collections Documentation

Welcome to the documentation for `@deessejs/collections`, a functional-first collection and data modeling layer built on Drizzle ORM.

## Getting Started

This documentation covers the product vision, features, architecture, and use cases. For implementation details and API references, see the individual documentation files.

## What is Currently Implemented

### Core Functionality

| Feature | Status | Description |
|---------|--------|-------------|
| **Collection System** | ✅ Implemented | Define data models using `collection()` function |
| **Field Types** | ✅ Implemented | Text, number, boolean, date, timestamp, JSON, array, select (enum), relations |
| **Field Options** | ✅ Implemented | required, unique, indexed, default, label, description |
| **Hooks** | ✅ Implemented | beforeCreate, afterCreate, beforeUpdate, afterUpdate, beforeDelete, afterDelete |
| **Plugins** | ✅ Implemented | Extensible plugin system for adding collections |
| **Config System** | ✅ Implemented | `defineConfig()` for centralized configuration |
| **PostgreSQL Adapter** | ✅ Implemented | `pgAdapter()` for PostgreSQL database connection |
| **Schema Generation** | ✅ Implemented | `buildSchema()` and `buildTable()` from collections |
| **Migration Commands** | ✅ Implemented | `push()`, `generate()`, `migrate()` functions |
| **Type Inference** | ✅ Implemented | Full TypeScript inference from collection definitions |

### Field Types Available

```typescript
import { f } from '@deessejs/collections'

// Primitive types
f.text()           // Text/string
f.email()          // Email (with validation)
f.url()            // URL (with validation)
f.number()         // Number
f.boolean()        // Boolean
f.date()           // Date (without timestamp)
f.timestamp()      // Date with timestamp
f.json()           // JSON object

// Complex types
f.select(['draft', 'published'])  // Enum/select
f.array(f.text())                 // Array of strings
f.relation({ collection: 'users' }) // Relations (one-to-one, one-to-many, many-to-many)
```

### What's Implemented vs What's Not

**Implemented:**
- Full CRUD via `config.db` (Drizzle instance)
- Schema generation from collections

**Not Implemented:**
- CRUD via `config.collections.*` (currently metadata only)
- Dynamic field generation (auto-slug, computed fields)
- Relationship cascade operations
- Field-level validation system

## Documentation Structure

### [Overview](overview.md)
Introduction to the project, its vision, philosophy, and target audience.

### [Features](features.md)
Comprehensive list of features including the collection system, field types, query API, hooks, plugins, and developer experience enhancements.

### [Philosophy](philosophy.md)
Deep dive into the design principles behind the project.

### [Architecture](architecture.md)
Technical architecture covering core components, data flow, type system, and plugin architecture.

### [Use Cases](use-cases.md)
Real-world scenarios where `@deessejs/collections` excels.

## Quick Start

```typescript
import { defineConfig, collection, field, f, pgAdapter } from '@deessejs/collections'

// Define your collections
const users = collection({
  slug: 'users',
  name: 'Users',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    email: field({ fieldType: f.email(), unique: true }),
    age: field({ fieldType: f.number() })
  }
})

// Create configuration
const config = defineConfig({
  database: pgAdapter({ url: 'postgres://localhost:5432/mydb' }),
  collections: [users]
})

// Access generated Drizzle schema
const { users: usersTable } = config.db
```

## Project Status

**Active Development** - Core foundation is implemented. Full CRUD operations and advanced features are on the roadmap.
