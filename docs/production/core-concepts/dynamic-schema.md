# Dynamic Schema & Next.js Integration

This document explains how Collections uses fully dynamic schema (no drizzle.config.ts) and the hot-reload system for Next.js.

## Dynamic Schema (No drizzle.config.ts)

Collections uses **fully dynamic schema** - no code generation, no config files. Everything happens in-memory at runtime.

### How It Works

```typescript
// No drizzle.config.ts needed!
// Collections creates tables dynamically at runtime

import { defineConfig } from '@deessejs/collections'
import { pgAdapter } from '@deessejs/collections-drizzle'

// 1. Define collections (just code)
const posts = defineCollection({
  slug: 'posts',
  fields: {
    title: { kind: 'text' },
    published: { kind: 'boolean' }
  }
})

// 2. Adapter creates tables dynamically
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL }),
  collections: [posts]
})

// Internally, the adapter:
// - Creates pgTable() objects in memory
// - Maps collection fields to Drizzle columns
// - Registers tables with the Drizzle instance
// - All happens at runtime, no generation
```

### No Code Generation

Traditional Drizzle requires:
- `drizzle.config.ts` for configuration
- Code generation: `drizzle-kit generate`
- Migration files

Collections does **none of this**:
- No config files
- No CLI commands
- Tables created in-memory at startup
- Schema lives in the running process only

### Migration Strategy

For production, you can still generate migrations if needed:

```typescript
// Optional: Generate migration SQL for deployment
const migrationSQL = config.generateMigration()

// Or use Drizzle Kit separately with the generated schema
export const schema = config.getSchema() // Returns Drizzle tables
```

But during development, everything is dynamic.

## Next.js Integration

Collections provides a **dynamic push system** for Next.js that hot-reloads collections when files change.

### withCollections

```typescript
// next.config.js or next.config.mjs
import { withCollections } from '@deessejs/collections/next'

export default withCollections({
  // Your Next.js config
})
```

### How Dynamic Push Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Development                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  collections/posts.ts ──────► File Watcher                  │
│        │                                                    │
│        │ (file change detected)                            │
│        ▼                                                    │
│  collections/reload() ◄───── Parse & Validate              │
│        │                                                    │
│        │ (update runtime schema)                          │
│        ▼                                                    │
│  API Routes updated ──────► Clients notified (optional)    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### What Happens on File Change

1. **Watcher detects change** in `collections/` folder
2. **Parse & validate** new collection definitions
3. **Update runtime** - recreate tables in memory
4. **Push to clients** - optional WebSocket notification
5. **API routes updated** - new collections available immediately

### Type Safety at Runtime

The system maintains full TypeScript safety:

```typescript
// types/collections.d.ts (auto-generated, gitignored)
export type CollectionNames = 'posts' | 'users' | 'comments'

export type Post = {
  id: string
  title: string
  published: boolean
  createdAt: Date
}

// Used by client components
import { type Post } from '@/types/collections'
```

### No Restart Needed

Traditional approach:
```
Edit file → Restart dev server → Wait → Continue
```

Collections approach:
```
Edit file → Saved → Hot-reloaded → Continue
```

The `withCollections` wrapper handles everything:
- File watching (using `chokidar` or Next.js's built-in watcher)
- Collection parsing and validation
- Runtime schema updates
- Type generation (background)
- Optional client notifications
