# CLI Requirements Analysis for @deessejs/collections

## 1. Executive Summary

**Key Findings:**

1. **Payload CMS is deeply coupled to Next.js** - Its `packages/next` module relies on Next.js-specific features for request initialization, auth, i18n, and admin UI. This coupling is architectural.

2. **Payload avoids drizzle.config.ts** - It uses `drizzle-kit/api` programmatically and has its own migration system. This is a better pattern than wrapping drizzle-kit CLI.

3. **@deessejs/collections is early-stage** - The `cli.ts` file is a placeholder with no implementation. The runtime (`createCollections`) is the core focus.

4. **Recommended approach: Payload-inspired CLI** - Use `drizzle-kit/api` programmatically with a single `collection.config.ts`. No `drizzle.config.ts` needed.

---

## 2. Payload Next.js Dependency Analysis

### What Payload Uses from Next.js

**Request Initialization (`initReq.ts`):**
```typescript
import { headers as getHeaders } from 'next/headers.js'
import { initI18n } from '@payloadcms/translations'
```

The `initReq` function:
- Gets HTTP headers via `next/headers`
- Parses cookies for auth
- Initializes i18n with language detection
- Creates a `PayloadRequest` object with user, permissions, locale

**Route Handlers (`packages/next/src/routes/`):**
- REST API: `/rest/[...slug]` - delegates to Payload operations
- GraphQL: `/graphql` and `/graphql/playground`
- Uses Next.js dynamic route handling

**Admin UI (`packages/ui`):**
- Built as React Server Components
- Uses `initReq` for every request
- Dashboard, list views, document editing all require Next.js context

**Key Architectural Pattern:**
```
Next.js Request → initReq() → PayloadRequest → Operations → DB Adapter
```

### Why This Cannot Be Replicated Without Next.js

1. **No standalone request object** - Next.js provides `headers()`, `cookies()`, `NextRequest` that are only available in Next.js context
2. **Admin UI requires Next.js** - React Server Components with payload context
3. **HMR depends on Next.js webpack** - `getPayloadHMR.ts` connects to `/_next/webpack-hmr`
4. **i18n initializes per-request** - Depends on Next.js locale detection

**Conclusion:** Payload CMS is not a good reference for framework-agnostic CLI design. It IS a Next.js application that happens to be modular.

---

## 3. Framework-Agnostic Requirements

For @deessejs/collections to be framework-agnostic, it needs:

### Core CLI Capabilities

| Capability | Description | Payload Analog |
|------------|-------------|----------------|
| **Project Init** | Scaffold new collections project | `npm create payload-app` |
| **Migration Generate** | Generate SQL migrations from schema | `drizzle-kit generate` |
| **Migration Run** | Apply migrations to database | Users run `drizzle-kit migrate` directly |
| **Push Schema** | Push schema changes directly (dev) | `drizzle-kit push` |
| **Type Generation** | Generate TypeScript types | `payload generate:types` |
| **Seed Data** | Populate database with sample data | Custom scripts |
| **Info** | Display project configuration | `payload info` |

### What Must NOT Depend on Next.js

1. **Database operations** - All DB access via direct connections
2. **Schema building** - Can use Drizzle directly
3. **Config loading** - From `collection.config.ts` (or similar)
4. **Type generation** - JSON Schema to TypeScript (no Next.js APIs)

### What CAN Work Without Next.js

1. **Migration generation** - Drizzle introspects DB, compares to schema, generates SQL
2. **Migration running** - Direct DB connection via credentials
3. **Push** - Direct DB push (shadow-of-production behavior)
4. **Type generation** - JSON Schema compilation
5. **Seed data** - Import scripts using runtime `createCollections`

---

## 4. CLI Command Inventory

### Essential Commands for @deessejs/collections

#### `collections init`
```
collections init [template]
```
- Creates `collection.config.ts` with boilerplate
- Sets up folder structure: `src/collections/`, `drizzle/`, `scripts/`
- Options: `--template minimal|todo|blog`
- **No `drizzle.config.ts` needed** - uses `drizzle-kit/api` programmatically

#### `collections generate`
```
collections generate [migration-name]
```
- Wrapper around `drizzle-kit generate`
- Uses collections config to produce Drizzle schema
- Runs migration file creation
- Options: `--dialect postgresql|mysql|sqlite` `--out ./drizzle`

#### `collections push`
```
collections push
```
- Direct schema push to database
- Useful for development: shadow production
- Options: `--force` for auto-approve data loss
- Options: `--verbose` to see all SQL

#### `collections generate:types`
```
collections generate:types
```
- Generates `collection-types.ts` from config
- Uses JSON Schema to TypeScript compilation
- Options: `--out ./src/generated/collection-types.ts`

#### `collections seed`
```
collections seed [script-path]
```
- Runs seed script using runtime
- Default: `./scripts/seed.ts`
- Uses `createCollections` runtime internally

#### `collections info`
```
collections info
```
- Displays database type, version
- Shows collections count and field summary
- Shows pending migrations

---

## 5. Architecture Options

### Option A: Integrated CLI (Recommended for v1)

**Structure:** `packages/collections/src/cli.ts`

```typescript
// Integrated CLI - commands as functions
export const init = async () => { /* ... */ }
export const generate = async () => { /* ... */ }
```

**Pros:**
- Single package to install
- Version aligned with runtime
- Easy to access collections config
- Lower maintenance burden

**Cons:**
- CLI grows package size
- CLI has different lifecycle (long-running vs short)

### Option B: Separate Package `@deessejs/collections-cli`

**Structure:** `packages/collections-cli/src/index.ts`

**Pros:**
- Separate concerns
- Can be installed globally
- CLI can have own dependencies

**Cons:**
- Version sync burden
- Two packages to maintain
- More complex monorepo setup

### Recommendation: Payload-Inspired (No drizzle.config.ts)

**Key Discovery:** Payload CMS avoids `drizzle.config.ts` entirely by using `drizzle-kit/api` programmatically and its own migration system.

**How Payload does it:**
- Schema built dynamically from `payload.config.ts` at runtime
- Uses `drizzle-kit/api` library (not CLI) for schema push
- Own migration system with `payload-migrations` collection
- Single source of truth: `payload.config.ts`

**Recommended approach for @deessejs/collections:**

```
collections init
  → collection.config.ts (single config file)

collections generate
  → Uses drizzle-kit/api programmatically
  → No drizzle.config.ts needed

Note: `migrate` is not implemented. Users run `drizzle-kit migrate` directly.

collections push (dev)
  → Calls pushSchema() from drizzle-kit/api
  → Direct DB schema push
```

**Why this is better:**
- Single config file (`collection.config.ts`) instead of two (`collection.config.ts` + `drizzle.config.ts`)
- Migration folder location controlled by `collection.config.ts`
- More flexible, matches Payload pattern
- Payload's `pushDevSchema()` approach is cleaner than CLI wrapping

---

## 6. Migration Strategy

### How Drizzle Kit Does It

From `drizzle-kit/src/cli/schema.ts`:

1. **Config file** (`drizzle.config.ts`) specifies schema path and DB credentials
2. **Generate command:**
   - Reads schema files
   - Creates snapshots of current state
   - Computes diff against previous snapshot
   - Prompts for rename decisions
   - Writes migration SQL + journal

3. **Migrate command:**
   - Connects to DB using credentials
   - Reads migration journal
   - Applies pending migrations in order
   - Updates journal entry after each

### For @deessejs/collections

**Recommended: drizzle-kit/api programmatically (Payload pattern)**
```
collection.config.ts
    → buildRawSchema() at CLI time
    → Use drizzle-kit/api directly (pushSchema, generateMigration)
    → No drizzle.config.ts needed
```

**Key Insight from Payload:** Use `drizzle-kit/api` programmatically like Payload does:
```typescript
const { pushSchema, generateMigration } = require('drizzle-kit/api')
await pushSchema(adapter.schema, adapter.drizzle)
```

The `buildRawSchema()` already exists in `src/adapter/core/buildRawSchema.ts`. Use it directly with drizzle-kit/api.

### Migration Folder Configuration

**Can the migrations folder be renamed?** Yes. The `migrations.dir` in `collection.config.ts` controls the migrations folder location.

**For `collections generate`**: Pass `out` to `generateMigration()`:
```typescript
await generateMigration({
  schema: drizzleSchema,
  out: config.migrations?.dir || './drizzle',
})
```

**Note:** `migrate` is not implemented. Users run `drizzle-kit migrate` directly.

---

## 7. Type Generation

### How Payload Does It

From `packages/payload/src/bin/generateTypes.ts`:

```typescript
const jsonSchema = configToJSONSchema(config, config.db.defaultIDType, i18n)
const compiled = await compile(jsonSchema, 'Config', { ... })
await fs.writeFile(outputFile, compiled)
```

Key functions:
- `configToJSONSchema()` - Converts config to JSON Schema
- `compile()` - Uses `json-schema-to-typescript` to generate types

### For @deessejs/collections

Type generation should:

1. **Read collection config** - Get all collections and fields
2. **Build JSON Schema** - For each collection, define object shape
3. **Generate TypeScript** - Use `compile()` or similar
4. **Write to file** - `collection-types.ts`

**Output format should be:**

```typescript
// Auto-generated types
export interface Post {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  name: string
}

// Type helpers
export type CollectionSlugs = 'posts' | 'users'
export type DataFromSlug<T extends CollectionSlugs> = ...
```

---

## 8. Project Initialization

### Payload's Approach

Uses `create-payload-app` which:
- Prompts for template (blank, with-auth, blog, etc.)
- Creates `payload.config.ts`
- Sets up Next.js app structure
- Installs dependencies

### For @deessejs/collections

**`collections init` should:**

1. **Create single config file** (`collection.config.ts`):
```typescript
import { defineCollections, collection, field, f } from '@deessejs/collections'

export default defineCollections({
  collections: [
    collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text() }),
      },
    }),
  ],
  db: postgres({ connectionString: process.env.DATABASE_URL }),
  migrations: {
    dir: './migrations',
    table: '__collections_migrations',
  },
})
```

**No `drizzle.config.ts` needed** - the CLI uses `drizzle-kit/api` programmatically.

2. **Create folder structure:**
```
src/
  collections/
scripts/
  seed.ts
migrations/  (or custom dir from config)
```

3. **Create seed script template:**
```typescript
import { createCollections } from '@deessejs/collections'
import config from './collection.config'

const { db } = createCollections(config)

await db.posts.create({ data: { title: 'Hello' } })
```

---

## 9. Recommendations

### Immediate (v0.1.0 - Minimal CLI)

1. **Implement `collections init`**
   - Create `collection.config.ts`
   - Create folder structure
   - Create seed script template
   - **No `drizzle.config.ts` needed**

2. **Implement `collections generate`**
   - Use `buildRawSchema()` to generate Drizzle schema
   - Invoke drizzle-kit generate internally
   - Or generate migrations directly (simpler path)

3. **Implement `collections generate:types`**
   - Use `configToJSONSchema()` pattern
   - Use `json-schema-to-typescript` to compile

### Short-term (v0.2.0 - Full CLI)

4. **Add `collections seed`**
   - Run user scripts with runtime

6. **Add `collections info`**
   - Display project status

### Medium-term (v0.3.0)

7. **Add `collections push`**
   - Direct schema push for dev workflows

### Implementation Notes

1. **Use `@drizzle-team/brocli`** - Drizzle's CLI framework is lightweight and battle-tested

2. **Config file format:**
   ```typescript
   // collection.config.ts
   import { defineConfig, collection, field, f } from '@deessejs/collections'

   export default defineConfig({
     collections: [...],
     db: {
       type: 'postgres',
       connectionString: process.env.DATABASE_URL,
     },
   })
   ```

3. **Do NOT make CLI depend on Next.js**
   - No `initReq` pattern
   - No server components
   - No app router
   - Direct DB connections only

4. **Integrate with drizzle-kit for migrations**
   - Collections schema → Drizzle schema file
   - drizzle-kit handles diff, SQL generation, journal

5. **Use `@deessejs/core` patterns**
   - `Result<T, E>` for error handling
   - `Maybe<T>` for optional values
   - No throwing, no null returns

---

## Summary

| Aspect | Recommendation |
|--------|----------------|
| **CLI Package** | Integrate into `packages/collections/src/cli.ts` |
| **Commands** | init, generate, push, generate:types, seed, info |
| **Migrations** | Use `drizzle-kit/api` programmatically (Payload pattern) |
| **Type Gen** | JSON Schema to TypeScript (like Payload) |
| **Config Format** | Single `collection.config.ts` (no drizzle.config.ts) |
| **DB Connection** | Direct (no framework) via credentials |
| **Not Supported** | Admin UI, REST/GraphQL API, i18n - these belong in user's framework |

**Key Insight from Payload Analysis:**

Payload CMS avoids `drizzle.config.ts` entirely by:
1. Building schema dynamically from its own config
2. Using `drizzle-kit/api` library (not CLI)
3. Having its own migration system

For @deessejs/collections, follow Payload's pattern: **single `collection.config.ts` + `drizzle-kit/api` programmatic approach**.
