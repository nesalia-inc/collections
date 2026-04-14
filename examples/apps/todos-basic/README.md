# Todos Basic Example

A minimal todo application demonstrating `@deessejs/collections` patterns.

## Features

This example showcases:

- **Collection Definition**: Creating a collection with `f.text()`, `f.boolean()`, and `f.select()`
- **Field Configuration**: Required fields, default values, and validation
- **Lifecycle Hooks**: `beforeCreate`, `afterCreate`, `beforeUpdate`, `afterUpdate`, `beforeDelete`, `afterDelete`
- **Type-safe Queries**: Using `where()`, `eq()`, and `or()` for building predicates
- **CRUD Operations**: Structure of `create`, `read`, `update`, `delete` operations
- **Pagination**: Both offset and cursor-based pagination

## Prerequisites

- Node.js 20+
- pnpm 9+

## Getting Started

1. **Install dependencies** from the repository root:

```bash
pnpm install
```

2. **Run the example**:

```bash
pnpm dev
```

Or directly:

```bash
pnpm example:todos
```

## Project Structure

```
todos-basic/
├── package.json       # Package configuration with workspace dependency
├── tsconfig.json      # TypeScript configuration
├── README.md          # This file
└── src/
    ├── index.ts       # Main entry point with demo
    ├── collections.ts # Todo collection definition
    └── config.ts      # App configuration with defineConfig
```

## Key Concepts Demonstrated

### Collection Definition

```typescript
export const todos = collection({
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

### Type-safe Queries

```typescript
import { where, eq, or } from '@deessejs/collections'

// Find incomplete pending todos
const predicate = where((p) => [
  eq(p.completed, false),
  or(eq(p.status, 'pending'), eq(p.status, 'in_progress'))
])
```

### CRUD Operations

```typescript
const todosDb = config.db.todos

// Create
const todo = await todosDb.create({ data: { title: 'New todo' } })

// Read
const allTodos = await todosDb.findMany()
const pendingTodos = await todosDb.findMany({
  where: where((p) => [eq(p.status, 'pending')])
})

// Update
await todosDb.update({
  where: where((p) => [eq(p.id, 'todo-123')]),
  data: { completed: true }
})

// Delete
await todosDb.delete({ where: where((p) => [eq(p.id, 'todo-123')]) })
```

## Note

This example runs in demonstration mode and does not connect to a real database. The collection definition, hooks, and query building are fully functional, but actual persistence requires setting up a Drizzle schema with a database connection.
