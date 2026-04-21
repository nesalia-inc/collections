# Todos Basic Example

A self-contained todo application demonstrating `@deessejs/collections` with SQLite.

## Prerequisites

- Node.js 20+
- pnpm 9+

## Quick Start

From the `examples/apps/todos-basic` directory:

```bash
# Install dependencies
pnpm install

# Run the example
pnpm dev
```

Or from the repository root:

```bash
pnpm install
pnpm example:todos
```

## What This Example Demonstrates

- **Collection Definition**: Creating a collection with `f.text()`, `f.boolean()`, and `f.select()`
- **Field Configuration**: Required fields, default values, and validation
- **Lifecycle Hooks**: `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`
- **Type-safe Queries**: Using `where()`, `eq()` for building predicates
- **CRUD Operations**: Create, read, update, delete, and batch create operations
- **Database Setup**: SQLite in-memory database with `createCollections` and `db.$push()`

## Project Structure

```
todos-basic/
├── package.json       # Package configuration with dependencies
├── tsconfig.json      # TypeScript configuration
├── README.md          # This file
└── src/
    └── index.ts       # Main entry point with collection definition and demo
```

## Key Patterns

### SQLite Setup Pattern

```typescript
import { createCollections, sqlite } from '@deessejs/collections'
import Database from 'better-sqlite3'

// Create better-sqlite3 database instance
const sqliteDb = new Database(':memory:')

// Create collections with database access
const result = createCollections({
  collections: [todos],
  db: sqlite(sqliteDb),
})

// Push schema to create tables
await db.$push()
```

### Collection Definition

```typescript
const todos = collection({
  slug: 'todos',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    completed: field({ fieldType: f.boolean(), defaultValue: false }),
    status: field({
      fieldType: f.select(['pending', 'in_progress', 'completed']),
      defaultValue: 'pending',
    }),
  },
  hooks: {
    beforeCreate: async (ctx) => { /* ... */ },
    afterCreate: async (ctx) => { /* ... */ },
  },
})
```

### CRUD Operations

```typescript
// Create
const todo = await db.todos.create({
  data: { title: 'New todo', completed: false, status: 'pending' }
})

// Read
const allTodos = await db.todos.findMany()
const pendingTodos = await db.todos.findMany({
  where: where((p) => [eq(p.status, 'pending')])
})

// Update
await db.todos.update({
  where: where((p) => [eq(p.id, todo.id)]),
  data: { completed: true }
})

// Delete
await db.todos.delete({ where: where((p) => [eq(p.id, todo.id)]) })
```
