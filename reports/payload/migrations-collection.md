# Payload CMS Migrations System

## 1. Overview

The `payload-migrations` collection is a **hidden internal collection** used by Payload CMS to track database migrations. It records every migration that has been executed against the database, allowing Payload to determine which migrations have already run.

---

## 2. How Payload's payload-migrations Collection Works

### 2.1 Collection Structure

Defined in `packages/payload/src/database/migrations/migrationsCollection.ts`:

```typescript
export const migrationsCollection: CollectionConfig = {
  slug: 'payload-migrations',
  admin: {
    hidden: true,       // Hidden from admin UI
  },
  endpoints: false,     // No REST/GraphQL endpoints
  fields: [
    {
      name: 'name',
      type: 'text',     // Migration file name (e.g., "20260213_172637_initial")
    },
    {
      name: 'batch',
      type: 'number',   // Batch number (-1 for dev, positive for production)
    },
  ],
  graphQL: false,
  lockDocuments: false,
}
```

The `MigrationData` type:

```typescript
export type MigrationData = {
  batch?: number
  id?: string
  name: string
}
```

---

### 2.2 Migration Tracking

#### Step 1: Read Migration Files from Disk

```typescript
const files = fs
  .readdirSync(payload.db.migrationDir)
  .sort()  // Sorted alphabetically/timestamp
  .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
```

#### Step 2: Query Already-Executed Migrations

```typescript
const migrationQuery = await payload.find({
  collection: 'payload-migrations',
  limit: 0,
  sort: ['-batch', '-name'],  // Sort by batch desc, then name desc
  where: {
    batch: {
      not_equals: -1,  // EXCLUDES dev pushes
    },
  },
})
```

#### Step 3: Compare and Execute

```typescript
for (const migration of migrationFiles) {
  const existingMigration = existingMigrations.find(
    (existing) => existing.name === migration.name,
  )

  if (existingMigration) {
    continue  // Skip already-run migrations
  }

  await runMigrationFile(payload, migration, newBatch)
}
```

---

### 2.3 Batch System

| Batch Number | Meaning |
|-------------|---------|
| `-1` | Dev Push (`pushDevSchema()`) |
| `0` | Initial (before first migration) |
| `1, 2, 3...` | Production Migrations |

#### Dev Push (Batch = -1)

```typescript
// In pushDevSchema.ts:
if (!devPush.length) {
  await drizzle.insert(adapter.tables.payload_migrations).values({
    name: 'dev',
    batch: -1,
  })
} else {
  await adapter.execute({
    raw: `UPDATE ${migrationsTable} SET updated_at = CURRENT_TIMESTAMP WHERE batch = '-1'`,
  })
}
```

#### Production Batches

```typescript
let latestBatch = 0
if (Number(migrationsInDB?.[0]?.batch) > 0) {
  latestBatch = Number(migrationsInDB[0]?.batch)
}

const newBatch = latestBatch + 1  // Increment
```

---

### 2.4 Migration Flow

#### Complete Flow

```
1. Check if migration table exists (migrationTableExists)
   └─ If not, auto-created by Drizzle

2. Read all migration files from disk (readMigrationFiles)
   └─ Sorted alphabetically by timestamp prefix

3. Query payload-migrations for already-executed migrations
   └─ Exclude batch = -1 when calculating latestBatch

4. Calculate newBatch = latestBatch + 1

5. For each migration file (in order):
   a. Check if migration.name already exists in DB
      └─ If yes, skip
   b. Execute migration.up({ db, payload, req })
   c. Create record: { name, batch: newBatch }
   d. If error, kill transaction and exit(1)
```

#### After Successful Migration

```typescript
await payload.create({
  collection: 'payload-migrations',
  data: {
    name: migration.name,
    batch: newBatch,
  },
  req,
})
```

---

### 2.5 Dev Push vs Production Migrations

| Aspect | Dev Push | Production Migrations |
|--------|----------|---------------------|
| **Trigger** | Automatic in dev mode | Manual via CLI |
| **Tool** | Drizzle Kit (`pushSchema`) | Migration files with `up()` |
| **Batch** | `-1` | `1, 2, 3...` |
| **Changes** | Direct schema modification | Versioned migration files |
| **Rollback** | Not tracked | Via `down()` |
| **Data Loss Risk** | High | Lower |

#### Dev Push Flow

```
1. User changes collection config
2. Payload restarts
3. pushDevSchema() compares (dequal)
4. If different, calls drizzle-kit pushSchema()
5. Inserts "dev" record with batch=-1
```

#### Production Migration Flow

```
1. Developer runs `payload migration:create`
2. New migration file created with timestamp
3. Developer edits file with up() and down()
4. On startup, migrate() checks payload-migrations
5. Executes unrun migrations
6. Records each with batch=N
```

---

### 2.6 Recovery Mechanism

#### On Migration Error

```typescript
async function runMigrationFile(payload, migration, batch) {
  try {
    await initTransaction(req)
    const db = await getTransaction(payload.db, req)
    await migration.up({ db, payload, req })

    await payload.create({
      collection: 'payload-migrations',
      data: { name: migration.name, batch },
      req,
    })
    await commitTransaction(req)
  } catch (err) {
    await killTransaction(req)  // Rollback
    payload.logger.error({ err, msg: `Error running migration ${migration.name}` })
    process.exit(1)  // Exit immediately
  }
}
```

#### Safety Prompt for Dev/Prod Conflicts

If `batch = -1` exists and user tries to run migrations:

```typescript
if (migrationsInDB.find((m) => m.batch === -1)) {
  const { confirm } = await prompts({
    message: "You've run Payload in dev mode...\n" +
             "If you'd like to run migrations, data loss will occur.",
  })

  if (!confirm) {
    process.exit(0)
  }
  // Filter out dev migration so batch numbering works
  migrationsInDB = migrationsInDB.filter((m) => m.batch !== -1)
}
```

#### Rollback Commands

| Command | Action |
|---------|--------|
| `migrateDown` | Rolls back latest batch via `down()` |
| `migrateReset` | Rolls back ALL migrations, deletes all records |
| `migrateRefresh` | Runs `migrateDown` then `migrate` |

---

### 2.7 Key Files

| File | Purpose |
|------|---------|
| `packages/payload/src/database/migrations/migrationsCollection.ts` | Collection schema |
| `packages/drizzle/src/migrate.ts` | Main migration execution |
| `packages/payload/src/database/migrations/getMigrations.ts` | Query existing migrations |
| `packages/payload/src/database/migrations/readMigrationFiles.ts` | Load migration files from disk |
| `packages/drizzle/src/utilities/pushDevSchema.ts` | Dev schema push (batch=-1) |
| `packages/drizzle/src/migrateDown.ts` | Rollback latest batch |
| `packages/drizzle/src/migrateReset.ts` | Reset all migrations |

---

## 3. Analysis: Does @deessejs/collections Need This?

### 3.1 Problem Analysis

#### What Problem Does an Internal Migrations Table Solve?

| Problem | How Payload Solves It |
|---------|----------------------|
| **Tracking which migrations have run** | Records name + batch in `payload-migrations` table |
| **Distinguishing dev pushes from production migrations** | Batch = -1 for dev, positive for production |
| **Preventing data loss when mixing dev/prod** | Safety prompt when batch=-1 exists and user tries to migrate |
| **Controlling migration execution order** | Reads from disk, compares against DB records |
| **Ensuring migrations run exactly once** | Checks `name` against existing records |

#### What @deessejs/collections Actually Needs

@deessejs/collections is a **runtime library**, not a framework. Its entry point `createCollections` is a factory function that:

1. Takes collection definitions
2. Builds a Drizzle schema
3. Returns typed DbAccess objects

The library does NOT:
- Run at startup to execute migrations
- Have a persistent server process
- Manage its own migration lifecycle
- Need to distinguish between dev/production push behavior

**Therefore, the core problem that Payload's table solves does not exist for @deessejs/collections.**

---

### 3.2 Payload's Approach Deep Dive

#### How Payload's `payload-migrations` Collection Works

```
1. readMigrationFiles() - reads .ts/.js files from disk
2. Query payload-migrations for existing records (WHERE batch != -1)
3. Check for batch=-1 (dev push), show safety prompt if found
4. Calculate newBatch = latestBatch + 1
5. For each migration file:
   a. Skip if migration.name already in DB
   b. Execute migration.up({ db, payload, req })
   c. Create record { name, batch: newBatch }
   d. On error: rollback transaction, exit(1)
```

#### Why Payload Needs This

Payload is a **framework** (Next.js CMS) with:
- **Persistent server process** - migrations run on server startup
- **Admin UI** - built-in collection for browsing migrations
- **Migration-first workflow** - users create migration files explicitly
- **Dev/Prod distinction** - `pushDevSchema()` for development, migrations for production

#### The Key Insight

Payload's `payload-migrations` is not just a migrations table -- it is a **first-class collection** integrated into Payload's ORM adapter:

```typescript
// From migrate.ts
const { payload } = this
await payload.find({ collection: 'payload-migrations', ... })
await payload.create({ collection: 'payload-migrations', ... })
```

@deessejs/collections has **no such integration**. Its adapter layer (`createCollections`) is a pure factory with no persistent state.

---

## 4. Alternative Approaches

### Option A: Rely Entirely on Drizzle-kit's Migration Journal (Recommended)

Drizzle-kit already tracks migrations using a journal table (configurable via `migrations.table` in drizzle.config.ts).

**How it works:**
- `drizzle-kit generate` creates SQL migration files + a `_drizzle_migrations` journal
- `drizzle-kit migrate` applies pending migrations using the journal
- The journal is automatically managed

**Pros:**
- Zero additional code in @deessejs/collections
- Leverages battle-tested Drizzle infrastructure
- Works identically across PostgreSQL, SQLite, MySQL
- Users already understand the pattern

**Cons:**
- Less control over migration behavior
- Tied to drizzle-kit's conventions

**Verdict: SUFFICIENT for @deessejs/collections needs.**

### Option B: Custom JSON File Tracking

Track migrations in a JSON file (e.g., `.collections-migrations`) instead of a DB table.

**Pros:**
- No database schema changes
- Simple to implement
- Works without database connection

**Cons:**
- File-based tracking is fragile (can get out of sync)
- Not atomic (no transactional safety)
- Doesn't work well in distributed environments

**Verdict: INFERIOR to drizzle-kit journal.**

### Option C: Use drizzle-kit/api Programmatically (Payload Pattern)

Use `drizzle-kit/api` directly as recommended in the CLI requirements analysis.

**Pros:**
- Follows Payload's proven pattern
- Single source of truth (collection.config.ts)
- No duplicate migration tracking

**Cons:**
- More complex than CLI wrapping
- Requires careful integration with drizzle-kit

**Verdict: RECOMMENDED for the CLI, but does NOT require an internal table.**

### Option D: Internal `__collections_migrations` Table

Add a dedicated table to track @deessejs/collections-specific migrations.

**Pros:**
- Full control over migration behavior
- Could track collection-specific metadata
- Aligns with Payload's approach

**Cons:**
- Introduces schema coupling
- Requires maintaining a "system" collection
- Complex to implement correctly
- Redundant with drizzle-kit's journal
- Violates the "delegate to Drizzle" principle

**Verdict: NOT NEEDED.**

---

## 5. Tradeoffs Analysis

### Drizzle-kit Journal vs Internal Table

| Aspect | Drizzle-kit Journal | Internal `__collections_migrations` Table |
|--------|--------------------|----------------------------------------|
| **Implementation effort** | Zero (built-in) | High |
| **Schema coupling** | None | Introduces system table |
| **Multi-database support** | Native | Must implement per-database |
| **Transaction safety** | Built-in | Must implement manually |
| **Dev vs prod distinction** | No | Could implement batch=-1 |
| **External migration compatibility** | Full | Could conflict |
| **Maintenance burden** | Low | High |
| **Framework-agnostic** | Yes | No |

### The Critical Question

**Does @deessejs/collections need to know which migrations have run?**

For the **runtime** (`createCollections`): **NO.**
- Factory is stateless
- Does not run migrations

For the **CLI**: **MAYBE (but not via internal table).**
- Wrap drizzle-kit commands instead

---

## 6. Recommendation

### Specific Recommendation: NO Internal Migrations Table

@deessejs/collections should NOT have its own `__collections_migrations` table:

1. **Principle of delegation** - Wraps Drizzle, not replaces it
2. **No persistent runtime** - `createCollections` is stateless
3. **CLI delegates to drizzle-kit** - No reimplementation needed
4. **Simplicity** - No benefit for the complexity cost
5. **Framework-agnosticism** - Custom table conflicts with portability

### What SHOULD Be Done Instead

The CLI should:

1. **Use `drizzle-kit/api` programmatically** (NOT `drizzle.config.ts`)
2. **Use `generateMigration()`** from drizzle-kit/api for creating migrations
3. **Use `pushSchema()`** for development schema pushes
4. **Users run `drizzle-kit migrate`** directly for applying migrations

The drizzle-kit migration journal handles all tracking needs.

**Key: No `drizzle.config.ts` file is generated or needed.**

### Implementation Sketch (Reference Only)

If needed, an internal table would look like:

```typescript
interface CollectionsMigration {
  name: string      // Migration file name
  batch: number     // -1 for dev push, positive for prod
  executedAt: Date  // Timestamp
}
```

Integration points:
- **CLI `migrate`** - Query table, execute pending, record each
- **CLI `push`** - Insert batch=-1 after schema push
- **Runtime startup** - NO integration (runtime doesn't run migrations)

**Why NOT recommended even with this sketch:**
- Complex per-database adapter implementation
- Redundant with drizzle-kit
- High maintenance burden

---

## 7. Conclusion

**@deessejs/collections does NOT need an internal `__collections_migrations` table.**

The library's architecture as a lightweight Drizzle wrapper means:
- Migrations are delegated to drizzle-kit
- The runtime (`createCollections`) is stateless
- The CLI wraps drizzle-kit commands
- Drizzle's migration journal provides all necessary tracking

Payload CMS needs its internal migrations table because:
- It has a persistent server process
- It distinguishes dev pushes (batch=-1) from production migrations
- Its ORM adapter is deeply integrated with Payload's request lifecycle

@deessejs/collections has none of these characteristics.

**Final recommendation: Close this investigation. No internal migrations table needed.**

---

## References

- Payload migrations collection: `reports/payload/migrations-collection.md`
- CLI requirements analysis: `reports/cli/cli-requirements-analysis.md`
- Payload migrate.ts: `temp/payload/packages/drizzle/src/migrate.ts`
- Payload pushDevSchema.ts: `temp/payload/packages/drizzle/src/utilities/pushDevSchema.ts`
- Drizzle-kit migration journal: Drizzle ORM official documentation
