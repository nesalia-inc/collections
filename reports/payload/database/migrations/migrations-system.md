# Payload CMS Database Migrations Analysis

## Overview

This report documents how Payload CMS handles database migrations, contrasting its migration-based approach with the push-based schema synchronization used by `@deessejs/collections`.

## Architecture

Payload uses a **migration-based approach** for production databases, while using **push-based schema sync** (via `pushDevSchema`) only in development. The key insight is that cloud PostgreSQL providers like Neon or Vercel Postgres **do not support** certain DDL operations like `ALTER TABLE ... ALTER COLUMN ... SET DATA TYPE serial`, making push-based schema changes unreliable for production.

```
Development: pushDevSchema (drizzle-kit push)
Production:  Migrations (explicit SQL files)
```

## Two-Layer System

### Layer 1: Development Push (`pushDevSchema`)

**File:** `packages/drizzle/src/utilities/pushDevSchema.ts`

`pushDevSchema` is Payload's development equivalent of `$push()`. It uses drizzle-kit's `pushSchema` to automatically create/update database tables during development.

**Key characteristics:**

1. **Skips if no changes**: Uses `dequal` to deep-compare the previous schema state with the current one, skipping if identical
2. **Interactive prompts**: If warnings or data loss risk exists, prompts the user for confirmation before applying
3. **Dev migration tracking**: Inserts a special "dev" migration with `batch = -1` to track when schema push occurred
4. **Condition-based execution**:

```typescript
// packages/drizzle/src/utilities/pushDevSchema.ts:21-41
if (process.env.PAYLOAD_FORCE_DRIZZLE_PUSH !== 'true') {
  const localeCodes = adapter.payload.config.localization?.localeCodes

  const equal = dequal(previousSchema, {
    localeCodes,
    rawTables: adapter.rawTables,
  })

  if (equal) {
    adapter.payload.logger.info('No changes detected in schema, skipping schema push.')
    return
  }
}
```

**When it's called:** In `db-postgres/src/connect.ts`:

```typescript
// packages/db-postgres/src/connect.ts:116-123
if (
  process.env.NODE_ENV !== 'production' &&
  process.env.PAYLOAD_MIGRATING !== 'true' &&
  this.push !== false  // <-- The push option controls this behavior
) {
  await pushDevSchema(this as unknown as DrizzleAdapter)
}
```

**The `push: false` option**: Cloud providers like Neon disable automatic push by setting `push: false` in the adapter configuration.

### Layer 2: Production Migrations

**File:** `packages/drizzle/src/migrate.ts`

Production uses explicit migration files with `up()` and `down()` functions, tracked in a `payload_migrations` collection.

## Migration Collection

Payload stores migration history in a `payload_migrations` collection (not a table) defined in `packages/payload/src/database/migrations/migrationsCollection.ts`:

```typescript
export const migrationsCollection: CollectionConfig = {
  slug: 'payload-migrations',
  admin: { hidden: true },
  fields: [
    { name: 'name', type: 'text' },
    { name: 'batch', type: 'number' },  // -1 for dev pushes
  ],
}
```

## Migration File Structure

### Template

**File:** `packages/payload/src/database/migrations/migrationTemplate.ts`

```typescript
export const migrationTemplate = `
import { MigrateUpArgs, MigrateDownArgs } from "@payloadcms/db-mongodb";

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  // Migration code
};

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  // Migration code
};
`
```

### Example Migration (PostgreSQL)

**File:** `templates/with-postgres/src/migrations/20260213_172637_initial.ts`

```typescript
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "users" (
     "id" serial PRIMARY KEY NOT NULL,
     "email" varchar NOT NULL,
     ...
   );

   CREATE TABLE "media" (
     "id" serial PRIMARY KEY NOT NULL,
     ...
   );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE "users" CASCADE; DROP TABLE "media" CASCADE;`)
}
```

## Migration Execution Flow

### `migrate()` Function

**File:** `packages/drizzle/src/migrate.ts`

```typescript
export const migrate: DrizzleAdapter['migrate'] = async function migrate(args) {
  const { payload } = this
  const migrationFiles = args?.migrations || (await readMigrationFiles({ payload }))
  const { existingMigrations, latestBatch } = await getMigrations({ payload })

  const newBatch = latestBatch + 1

  // Execute 'up' function for each migration sequentially
  for (const migration of migrationFiles) {
    const alreadyRan = migrationsInDB.find((existing) => existing.name === migration.name)
    if (alreadyRan) continue

    await runMigrationFile(payload, migration, newBatch)
  }
}
```

### Key Behaviors

1. **Sequential execution**: Migrations run in order, one at a time
2. **Batch numbering**: Each run gets a new batch number (`latestBatch + 1`)
3. **Transaction per migration**: Each migration runs in its own transaction
4. **Migration tracking**: After each successful migration, inserts a record into `payload-migrations` collection

### Dev vs Production Detection

**File:** `packages/drizzle/src/migrate.ts:46-68`

If a dev push migration (`batch = -1`) exists, Payload prompts for confirmation before running production migrations:

```typescript
if (migrationsInDB.find((m) => m.batch === -1)) {
  const { confirm: runMigrations } = await prompts({
    name: 'confirm',
    type: 'confirm',
    message:
      "It looks like you've run Payload in dev mode, meaning you've dynamically pushed changes to your database.\n\n" +
      "If you'd like to run migrations, data loss will occur. Would you like to proceed?",
  })
  // ...
  migrationsInDB = migrationsInDB.filter((m) => m.batch !== -1)
}
```

## Migration Discovery

**File:** `packages/payload/src/database/migrations/readMigrationFiles.ts`

Migrations are discovered from:
1. **Explicit migrations directory** (configurable via `migrationDir`)
2. **Built-in migrations** for Payload versions (e.g., `localizeStatus`)

## The `push: false` Pattern for Cloud Providers

### Vercel Postgres / Neon Configuration

**File:** `templates/_agents/rules/adapters.md`

```typescript
db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URL },
  push: false, // Don't auto-push schema changes
  migrationDir: './migrations',
})
```

### Why `push: false`?

Cloud PostgreSQL providers often:
1. Don't allow DDL outside of migrations
2. Have restrictions on `ALTER TABLE ... SET DATA TYPE` for serial/uuid columns
3. Use managed schemas where the database user doesn't have full DDL rights

## Migration vs Push Comparison

| Aspect | `pushDevSchema` | Migrations |
|--------|------------------|------------|
| **Environment** | Development only | Production |
| **Trigger** | Automatic on schema change | Manual via CLI |
| **Reversibility** | Not directly | Via `down()` function |
| **Cloud support** | Limited | Full |
| **Batch tracking** | `-1` batch | Sequential batches |

## CLI Commands

### Create Migration

```bash
payload migrate:create --name my_migration
```

### Run Migrations

```bash
payload migrate
```

### Rollback (Down)

```bash
payload migrate:down
```

### Refresh

```bash
payload migrate:refresh
```

## Recommendations for @deessejs/collections

### Current Problem

`$push()` in `@deessejs/collections` uses `drizzle-kit`'s `pushSchema` which:
1. Fails on cloud PostgreSQL when trying to alter column types (serial/uuid)
2. Has no migration tracking mechanism
3. Cannot rollback changes

### Proposed Solution

1. **Add `push: false` option** to `postgres()` helper:

```typescript
export const postgres = (connection: any, options?: { push?: boolean }): DbConnection => ({
  type: 'postgres',
  connection,
  options: { push: options?.push ?? true },  // Default true for dev, false for production
})
```

2. **Create migration system**:

```typescript
// Option 1: Minimal migrations
interface Migration {
  name: string
  up: (db: DbAccess) => Promise<void>
  down?: (db: DbAccess) => Promise<void>
}

// CLI command to generate migrations
// Migration files stored in configurable directory
```

3. **Detection pattern**: Match Payload's dev/production detection:

```typescript
if (
  process.env.NODE_ENV !== 'production' &&
  this.push !== false
) {
  await this.$push()
}
```

## References

- `packages/drizzle/src/utilities/pushDevSchema.ts` - Development schema push
- `packages/drizzle/src/migrate.ts` - Production migration runner
- `packages/payload/src/database/migrations/migrationsCollection.ts` - Migration collection config
- `packages/db-postgres/src/connect.ts` - When to push vs migrate
- `packages/db-vercel-postgres/src/connect.ts` - Cloud provider configuration example
