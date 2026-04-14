# Examples

These examples demonstrate how to use @deessejs/collections to build type-safe data models with SQL databases using Drizzle ORM.

## Snippets

Code snippets demonstrating individual features and patterns. Each file covers a specific use case.

## Apps

**todos-basic** - A minimal todo application showing the core @deessejs/collections patterns in action. Demonstrates creating collections, defining fields, and basic CRUD operations.

Additional example applications will be added here over time.

## Features

**pagination** - Deep dive into offset and cursor-based pagination with @deessejs/collections. Covers how to implement paginated queries with configurable page sizes and cursor tracking.

**hooks** - Exploring lifecycle hooks available in @deessejs/collections. Shows how to attach behavior to collection operations like create, update, and delete.

## Running Examples

Install dependencies from the repository root:

```bash
pnpm install
```

Run the todos-basic example:

```bash
pnpm example:todos
```

Or run any app directly using turbo:

```bash
pnpm --filter @deessejs/examples-todos dev
```
