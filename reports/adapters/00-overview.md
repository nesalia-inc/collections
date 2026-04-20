# Adapter Implementation Guide for @deessejs/collections

> **Revised based on senior review** - Fixed: RawColumn types, enum handling, hooks integration, transaction API, SQLite mappings, missing operators

## Overview

This guide covers the implementation of the Drizzle ORM adapter for `@deessejs/collections`. The adapter follows a **two-layer virtual schema pattern** similar to Payload CMS's approach.

## Architecture Summary

```
Collection Definition (High-Level)
         ↓
    RawTable/RawColumn (Mid-Level IR - Dialect Agnostic)
         ↓
    Drizzle Schema (Low-Level - Dialect Specific)
         ↓
    SQL (Database)
```

## Current Status

| Component | Status |
|-----------|--------|
| `collection()` + `field()` + `f.*` | ✅ Implemented |
| `where()`, `orderBy()`, `select()` | ✅ Implemented |
| All operators (eq, like, has, etc.) | ✅ Implemented |
| Hooks (10 total) | ✅ Implemented |
| `defineConfig()` | ✅ Implemented (type-only, no runtime) |
| `createCollections()` | ❌ Planned - NOT YET IMPLEMENTED |
| Drizzle adapter | ❌ Planned - NOT YET IMPLEMENTED |
| Server plugin | ❌ Planned - NOT YET IMPLEMENTED |

## Real Collection Syntax

```typescript
import { collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.text() }),
    status: field({ fieldType: f.select(['draft', 'published']), defaultValue: 'draft' }),
  },
  hooks: {
    beforeCreate: async (ctx) => ctx,
  },
})
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| RawTable/RawColumn abstraction | Allows dialect-specific conversion without changing the core |
| Direct database access | No HTTP layer for initial implementation |
| `createCollections()` entry point | Replaces `defineConfig()` with full runtime support |
| Plugin integration for @deessejs/server | Zero coupling, type-safe RPC |

## File Structure

```
src/adapter/
├── core/
│   ├── types.ts          # RawTable, RawColumn, BaseColumn types
│   ├── mapper.ts         # fieldToRawColumn conversion
│   └── schemaBuilder.ts  # buildRawSchema
├── postgres/
│   └── schema/
│       └── buildDrizzleTable.ts  # PostgreSQL-specific conversion
├── sqlite/
│   └── schema/
│       └── buildDrizzleTable.ts   # SQLite-specific conversion
├── queries/
│   ├── whereToDrizzle.ts   # WhereNode → Drizzle SQL
│   ├── orderByToDrizzle.ts # OrderBy → Drizzle order
│   └── selectToDrizzle.ts  # Select projection
├── operations/
│   ├── create.ts
│   ├── findMany.ts
│   └── ...
└── types.ts               # DatabaseAdapter interface
```

## Next Steps

1. [Architecture Details](01-architecture.md) - Two-layer design
2. [Type Mapping Reference](02-type-mapping.md) - ColumnType to Drizzle mapping
3. [Implementation](12-implementation-steps.md) - Step-by-step guide
