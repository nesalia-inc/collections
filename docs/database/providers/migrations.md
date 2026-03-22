# Migrations

Collections uses **dynamic schema** - no static `drizzle.config.ts`. Migrations are handled differently.

## How It Works

```typescript
// Schema is built at runtime from collections
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, users]
})

// Generate migrations from collections
// npx collections migrate
```

The CLI reads your collection definitions and generates appropriate SQL migrations for the configured provider.

## Migration Flow

1. **Development**: Schema is built dynamically, auto-creates tables
2. **Staging/Prod**: Use CLI to generate and apply migrations
3. **Changes**: Modify collections → run `migrate` → SQL diff generated

This approach gives you:
- Fast prototyping with auto-migration
- Production control with explicit migrations
- Provider-specific SQL output

## Performance

The provider translation happens **once at startup**, not per-request:

```typescript
// defineConfig compiles schema once
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, users]
})

// All subsequent operations use cached schema
config.db.posts.find()  // No translation overhead
config.db.users.create() // Fast
```

The field-to-column mapping is resolved during `defineConfig`, ensuring zero runtime overhead.

## Dynamic Schema & Next.js Integration

For details on how Collections uses fully dynamic schema (no drizzle.config.ts) and the hot-reload system for Next.js, see [Dynamic Schema](../../core-concepts/dynamic-schema.md).
