# Adapter Implementation Guide

Decomposed into focused documents for easier navigation.

> **Note**: `createCollections()` and the Drizzle adapter are **planned but not yet implemented**. Only `defineConfig()` exists (type-only).

## Documents

| # | File | Contents |
|---|------|----------|
| 00 | [overview.md](00-overview.md) | High-level overview, architecture summary |
| 01 | [architecture.md](01-architecture.md) | Two-layer design, RawTable/RawColumn types |
| 02 | [type-mapping.md](02-type-mapping.md) | ColumnType to Drizzle mapping reference |
| 03 | [postgresql-implementation.md](03-postgresql-implementation.md) | PostgreSQL buildDrizzleTable |
| 04 | [sqlite-implementation.md](04-sqlite-implementation.md) | SQLite buildDrizzleTable |
| 05 | [mapper.md](05-mapper.md) | fieldToRawColumn mapper, buildRawSchema |
| 06 | [where-to-drizzle.md](06-where-to-drizzle.md) | WhereNode to Drizzle with all operators |
| 07 | [orderby-select.md](07-orderby-select.md) | OrderBy and Select converters |
| 08 | [interface.md](08-interface.md) | DatabaseAdapter interface, transactions |
| 09 | [error-handling.md](09-error-handling.md) | Error types, PostgreSQL error codes |
| 10 | [testing.md](10-testing.md) | Unit and integration tests |
| 11 | [security.md](11-security.md) | SQL injection prevention |
| 12 | [implementation-steps.md](12-implementation-steps.md) | Phase-by-phase implementation guide |
| 13 | [critical-files.md](13-critical-files.md) | Key files for implementation |
| 14 | [fixes-summary.md](14-fixes-summary.md) | Summary of all fixes applied |
| 15 | [user-guide.md](15-user-guide.md) | End-user developer experience guide |

## Quick Reference

### Actual Collection Syntax (from codebase)

```typescript
import { collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.text() }),
    status: field({ fieldType: f.select(['draft', 'published']), defaultValue: 'draft' }),
  },
})
```

### Actual Query Syntax

```typescript
import { where, eq, ne, orderBy, desc, asc, select } from '@deessejs/collections'

// Where
where((p) => [eq(p.status, 'published'), ne(p.title, 'Draft')])

// Order by
orderBy((p) => [desc(p.createdAt), asc(p.title)])

// Select
select<Post>()(p => ({ id: p.id, title: p.title }))
```

### Operators

| Tag | Drizzle |
|-----|---------|
| `Eq`, `Ne`, `Gt`, `Gte`, `Lt`, `Lte` | `eq()`, `ne()`, etc. |
| `Between` | `between()` |
| `In`, `NotIn` | `inArray()` |
| `IsNull`, `IsNotNull` | `isNull()`, `isNotNull()` |
| `Like`, `Contains`, `StartsWith`, `EndsWith` | `like()` with wildcards |
| `Has`, `HasAny`, `Overlaps` | Raw SQL (`@>`, `&&`) |
| `Search` | `to_tsvector/to_tsquery` |
| `And`, `Or`, `Not` | `and()`, `or()`, `not()` |

### DatabaseAdapter Interface (planned - NOT IMPLEMENTED)

```typescript
interface DatabaseAdapter {
  readonly dialect: Dialect
  readonly tables: Record<string, unknown>
  readonly rawTables: Map<string, RawTable>
  readonly enums: Record<string, unknown>
  readonly db: PostgresDb | SqliteDb
  initialize(collections: Collection[]): Promise<void>
  forCollection<TSlug extends string>(slug: TSlug): CollectionDbMethods<any>
  transaction<T>(fn: (tx: any) => Promise<T>): Promise<T>
}
```
