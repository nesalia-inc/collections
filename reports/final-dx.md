# Developer Experience: @deessejs/collections

## Overview

@deessejs/collections is a **runtime library** that wraps Drizzle ORM with a type-safe collection API. No admin UI, no framework coupling, no `drizzle.config.ts` needed.

**Key differentiator:** Your schema is defined once in `collection.config.ts` and drives everything - runtime, CLI, and type generation.

---

## Quick Start

### 1. Define Your Collections

```typescript
// collection.config.ts
import { defineCollections, collection, field, f } from '@deessejs/collections'

export default defineCollections({
  db: postgres({ connectionString: process.env.DATABASE_URL! }),
  collections: [
    collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text(), required: true }),
        content: field({ fieldType: f.text() }),
        published: field({ fieldType: f.boolean(), default: false }),
        authorId: field({ fieldType: f.relation({ collection: 'users' }) }),
        tags: field({ fieldType: f.array(f.text()) }),  // JSON storage
      },
    }),
    collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: f.text() }),
        email: field({ fieldType: f.email(), required: true }),
      },
    }),
  ],
})
```

### 2. Use in Your App

```typescript
import { createCollections } from '@deessejs/collections'
import config from './collection.config'

const { db, definitions } = createCollections(config)

// Query
const posts = await db.posts.findMany({
  where: eq(posts.published, true),
  orderBy: desc(posts.createdAt),
})

// Create
const newPost = await db.posts.create({
  data: {
    title: 'My Post',
    content: 'Hello world',
    published: true,
    authorId: user.id,
  },
})

// Update
await db.posts.update({
  where: eq(posts.id, postId),
  data: { published: false },
})

// Delete
await db.posts.delete({
  where: eq(posts.id, postId),
})
```

---

## The API

### Collection Definition

```typescript
collection({
  slug: 'posts',           // Unique identifier
  fields: { ... },          // Field definitions
  indexes: ['title'],       // Optional: database indexes
})
```

### Available Field Types

| Field Type | Database Type | Notes |
|------------|---------------|-------|
| `f.text()` | VARCHAR | |
| `f.number()` | NUMERIC | |
| `f.boolean()` | BOOLEAN | |
| `f.email()` | VARCHAR | Validated email format |
| `f.url()` | VARCHAR | Validated URL format |
| `f.date()` | TIMESTAMP | |
| `f.timestamp()` | TIMESTAMP | With timezone |
| `f.uuid()` | UUID | Auto-generated |
| `f.json()` | JSONB | |
| `f.select()` | ENUM | |
| `f.relation()` | UUID + FK | BelongsTo relationship |
| `f.array(item)` | JSON | Stores as JSON array |

### Field Options

```typescript
field({
  fieldType: f.text(),
  required: true,           // NOT NULL
  default: 'Untitled',     // Default value
  indexed: true,           // Add database index
})
```

### Auto-Generated Fields

Every collection automatically gets:
- `id` - UUID primary key
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### Query API

```typescript
// Where clause
db.posts.findMany({
  where: eq(posts.published, true),
})

// With comparison operators
db.posts.findMany({
  where: and(
    eq(posts.published, true),
    gte(posts.createdAt, lastWeek),
  ),
})

// Select specific fields
db.posts.findMany({
  select: { id: posts.id, title: posts.title },
})

// Pagination
db.posts.findMany({
  skip: 0,
  take: 20,
})

// Order
db.posts.findMany({
  orderBy: desc(posts.createdAt),
})
```

### Supported Operators

| Operator | Description |
|----------|-------------|
| `eq(a, b)` | Equal |
| `ne(a, b)` | Not equal |
| `gt(a, b)`, `gte(a, b)` | Greater than |
| `lt(a, b)`, `lte(a, b)` | Less than |
| `inArray(a, [b, c])` | In array |
| `notInArray(a, [b, c])` | Not in array |
| `like(a, '%text%')` | SQL LIKE |
| `isNull(a)` | IS NULL |
| `isNotNull(a)` | IS NOT NULL |
| `and(...predicates)` | AND combinator |
| `or(...predicates)` | OR combinator |

---

## CLI Commands

### `collections push`

Push schema changes directly to database (development).

```bash
collections push
collections push --config ./collection.config.ts
collections push --force  # Accept data loss warnings
```

**What it does:**
1. Reads `collection.config.ts`
2. Builds Drizzle schema
3. Compares with current database
4. Pushes changes

**No `drizzle.config.ts` needed** - uses `drizzle-kit/api` directly.

### `collections generate`

Generate migration files.

```bash
collections generate my-migration-name
collections generate --out ./migrations
```

### `collections init`

Scaffold a new project.

```bash
collections init
collections init --template minimal
collections init --template todo
```

---

## Database Support

### PostgreSQL

```typescript
defineCollections({
  db: postgres({ connectionString: 'postgresql://...' }),
  // or
  db: postgres(myDrizzleDb),
  collections: [...],
})
```

### SQLite

```typescript
defineCollections({
  db: sqlite({ path: './db.sqlite' }),
  // or
  db: sqlite(myBetterSqliteDb),
  collections: [...],
})
```

### MySQL (planned)

```typescript
defineCollections({
  db: mysql({ connectionString: 'mysql://...' }),
  collections: [...],
})
```

---

## What About Migrations?

### Development: `collections push`

For rapid development, use `collections push` to sync schema changes directly.

```bash
collections push
```

### Production: `collections generate`

For production, generate proper migration files.

```bash
collections generate my-feature
# Edit generated migration if needed
```

Then apply with drizzle-kit:

```bash
drizzle-kit migrate
```

**Why separate?** Schema push is fast but dangerous. Migrations are safe but require review. Choose based on environment.

---

## Hooks

```typescript
collection({
  slug: 'posts',
  hooks: {
    beforeCreate: async ({ data }) => {
      data.slug = slugify(data.title)
      return data
    },
    afterCreate: async ({ result }) => {
      await sendNotification(result)
    },
  },
  fields: { ... },
})
```

### Available Hooks

| Hook | When |
|------|------|
| `beforeOperation` | Before any operation |
| `afterOperation` | After any operation |
| `beforeCreate` | Before create |
| `afterCreate` | After create |
| `beforeUpdate` | Before update |
| `afterUpdate` | After update |
| `beforeDelete` | Before delete |
| `afterDelete` | After delete |
| `beforeRead` | Before read |
| `afterRead` | After read |

---

## Error Handling

@deessejs/collections uses `@deessejs/fp` patterns:

```typescript
import { Result, isOk, isErr, match } from '@deessejs/fp'

const result = await db.posts.create({
  data: { title: 'Test' },
})

if (isErr(result)) {
  // Handle error
  console.error(result.error.code)  // 'UNIQUE_VIOLATION', etc.
  return
}

// result is Ok
const post = result.value
```

### PostgreSQL Error Codes

| Code | Meaning |
|------|---------|
| `23505` | Unique constraint violation |
| `23502` | Not null violation |
| `23503` | Foreign key violation |

---

## Planned Features

### Phase 2 (Not Yet Implemented)

| Feature | Status | Notes |
|---------|--------|-------|
| **hasMany relations** | Planned | Auto-generated junction tables |
| **Blocks field** | Planned | Table-based blocks (not JSON) |
| **beforeSchemaInit hook** | Planned | Hook before schema building |
| **afterSchemaInit hook** | Planned | Hook after schema building |

### Not Planned

| Feature | Why |
|---------|-----|
| Admin UI | Belongs in user code/framework |
| REST/GraphQL API | Belongs in user code/framework |
| Authentication | Belongs in user code/framework |
| Localization/i18n | Complex, can be added later |
| Polymorphic relations | Use explicit junction tables instead |

---

## Comparison with Payload CMS

| Aspect | @deessejs/collections | Payload CMS |
|--------|----------------------|-------------|
| Type | Runtime library | Full-stack CMS |
| Framework | Any (Vanilla Node, Express, etc.) | Next.js only |
| Schema config | `collection.config.ts` | `payload.config.ts` |
| Config files | Single | Multiple (config + drizzle.config) |
| Schema push | Built-in | Built-in |
| Migrations | Via drizzle-kit | Via `payload-migrations` collection |
| Admin UI | None | Built-in React admin |
| API | None (your code) | Built-in REST/GraphQL |
| Auth | None (your code) | Built-in with Auth |
| Learning curve | Low | High |

---

## Comparison with Prisma/Drizzle

| Aspect | @deessejs/collections | Prisma | Drizzle |
|--------|----------------------|--------|---------|
| Schema location | `collection.config.ts` | `schema.prisma` | `schema.ts` |
| Type safety | High (Zod) | High | Medium |
| Relation syntax | `f.relation()` | `@relation` | Explicit joins |
| Migration tool | Via drizzle-kit | `prisma migrate` | `drizzle-kit` |
| Runtime overhead | Low | Medium | Low |
| CLI | Own | Own | Via drizzle-kit |

---

## File Structure

```
my-project/
├── collection.config.ts      # Your schema definition
├── drizzle/                  # Migration files
│   └── 20240215_001_my-migration.sql
├── src/
│   ├── collections/          # Your collection definitions
│   │   ├── posts.ts
│   │   └── users.ts
│   └── app.ts               # Your application
└── package.json
```

---

## Getting Started

```bash
# Install
npm install @deessejs/collections

# Initialize a project
collections init

# Start coding
# Edit collection.config.ts

# Push schema (dev)
collections push

# Generate migrations (prod)
collections generate my-feature
drizzle-kit migrate
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `reports/final-dx.md` | This document - User guide |
| `reports/gap-analysis.md` | What exists vs what's planned |
| `reports/expected-result-cli.md` | CLI implementation details |
| `reports/expected-result-hasMany-api.md` | hasMany relations design |

---

## Summary

@deessejs/collections gives you:

- ✅ **Single source of truth** - `collection.config.ts` drives everything
- ✅ **Type-safe collections** - Zod validation on all fields
- ✅ **No drizzle.config.ts** - Uses `drizzle-kit/api` directly
- ✅ **Framework agnostic** - Works with any Node.js framework
- ✅ **Hooks** - Before/after operations
- ✅ **Result-based errors** - `@deessejs/fp` patterns
- ✅ **CLI** - push, generate, init

What's coming:

- 🔄 **hasMany junction tables** - For many-to-many relations
- 🔄 **Blocks field** - Table-based blocks
- 🔄 **Schema init hooks** - beforeSchemaInit/afterSchemaInit
