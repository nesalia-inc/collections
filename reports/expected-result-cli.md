# Expected Result: CLI Implementation

## Readiness Assessment: **READY TO IMPLEMENT**

All building blocks are present. Only the CLI layer is missing.

---

## 1. Current CLI State

**File**: `packages/collections/src/cli.ts`

```typescript
// CLI placeholder
export {}
```

**Status**: Pure placeholder. No implementation whatsoever.

**However**:
- `package.json` already has the `bin` entry configured
- `drizzle-kit` is already a dependency
- All building blocks (`buildRawSchema`, `buildDrizzleTable`, `createCollections`) exist

---

## 2. drizzle-kit/api Integration

**YES - drizzle-kit/api CAN be used programmatically.**

Available functions from `drizzle-kit/api` (v0.31.0):

| Function | Purpose | Use |
|----------|---------|-----|
| `generateMigration` | Generate SQL migration files | `collections generate` |
| `generateDrizzleJson` | Generate drizzle JSON snapshot | Debug |
| `pushSchema` | Push schema directly to DB (Postgres) | `collections push` |
| `pushSQLiteSchema` | Push schema directly to DB (SQLite) | `collections push` |
| `upPgSnapshot` | PostgreSQL snapshot operations | Future |

**Key Finding**: Direct programmatic use, not CLI wrapping.

---

## 3. Commands Prioritization

| Priority | Command | Justification |
|----------|---------|---------------|
| **P0** | `collections push` | Core differentiator - schema push without drizzle.config.ts |
| **P1** | `collections generate` | Migration generation using drizzle-kit/api |
| **P2** | `collections init` | Project scaffolding |
| **P2** | `collections generate:types` | TypeScript type generation |
| **P3** | `collections seed` | Seed data scripts |
| **P3** | `collections info` | Debug/diagnostic |

**Note:** The `migrate` command is intentionally omitted. Users run `drizzle-kit migrate` directly since migrations are delegated to drizzle-kit.

---

## 4. Architecture

### Directory Structure

```
packages/collections/src/
  cli.ts                    # Main entry point (bin)
  cli/
    index.ts               # CLI command router
    commands/
      push.ts              # collections push (P0)
      generate.ts          # collections generate (P1)
      init.ts              # collections init (P2)
      generateTypes.ts     # collections generate:types (P2)
      seed.ts              # collections seed (P3)
      info.ts              # collections info (P3)
    utils/
      loadConfig.ts        # Dynamic config loading
      buildDrizzleSchema.ts # Collections → Drizzle schema
      drizzleKitApi.ts     # drizzle-kit/api wrapper
```

### Delegation Pattern

| Command | Own | Delegates to drizzle-kit/api |
|---------|-----|------------------------------|
| `push` | Yes - config loading + push | `pushSchema` / `pushSQLiteSchema` |
| `generate` | Yes - config loading | `generateMigration` |
| `init` | Yes - scaffolding | No |
| `generate:types` | Yes - type gen | No |
| `seed` | Yes - script runner | No |
| `info` | Yes - diagnostic | No |

**Note:** `migrate` is not implemented. Users run `drizzle-kit migrate` directly.

---

## 5. API Design Per Command

### `collections push`

```typescript
interface PushOptions {
  config?: string        // Path to collection.config.ts (default: ./collection.config.ts)
  forceAcceptWarning?: boolean
  verbose?: boolean
}

collections push [--config <path>] [--force] [--verbose]
```

**Flow:**
```
1. Load collection.config.ts
2. Call buildRawSchema(collections) → Map<string, RawTable>
3. Convert RawTable[] → Drizzle schema objects
4. Call pushSchema(drizzleDb, { schema: drizzleSchema })
5. Display diff and apply
```

### `collections generate`

```typescript
interface GenerateOptions {
  config?: string
  name?: string          // Migration name (default: timestamp)
  out?: string           // Output folder (default: ./drizzle)
}

collections generate [name] [--config <path>] [--out <folder>]
```

**Flow:**
```
1. Load collection.config.ts
2. Call buildRawSchema(collections) → Map<string, RawTable>
3. Call generateMigration(drizzleDb, { schema: drizzleSchema, snapshots })
4. Write migration files
```

### `collections init`

```typescript
interface InitOptions {
  template?: 'minimal' | 'todo' | 'blog'
  out?: string           // Project directory
}

collections init [--template <name>] [--out <dir>]
```

### `collections generate:types`

```typescript
interface GenerateTypesOptions {
  config?: string
  out?: string           // Output file (default: ./types/collections.ts)
}

collections generate:types [--config <path>] [--out <file>]
```

### `collections seed`

```typescript
interface SeedOptions {
  config?: string
  script?: string        // Seed script path
}

collections seed [--config <path>] [--script <path>]
```

### `collections info`

```typescript
collections info [--config <path>]
```

Displays: collections list, DB connection status, migration status.

---

## 6. Key Implementation Details

### Config Loading

```typescript
// Dynamic import of collection.config.ts
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const config = require(path.resolve(options.config || './collection.config'))
```

### Schema Building Bridge

```typescript
// CLI utility to build Drizzle schema from collections
import { buildRawSchema } from '../adapter/core/buildRawSchema.js'
import { buildDrizzleTable } from '../adapter/postgresql/buildDrizzleTable.js'

export function buildDrizzleSchema(collections: Collection[]) {
  const rawTables = buildRawSchema(collections)

  const drizzleSchema = {}
  for (const [name, rawTable] of rawTables) {
    drizzleSchema[name] = buildDrizzleTable(rawTable)
  }

  return drizzleSchema
}
```

### drizzle-kit/api Wrapper

```typescript
// utils/drizzleKitApi.ts
import { pushSchema, generateMigration } from 'drizzle-kit/api'

export const drizzleKitApi = {
  push: pushSchema,
  generate: generateMigration,
  // ...
}
```

---

## 7. Files to Modify

| File | Change |
|------|--------|
| `packages/collections/src/cli.ts` | Replace placeholder with CLI entry point |
| `packages/collections/src/cli/` | Create new directory with all command implementations |
| `packages/collections/src/adapter/core/buildRawSchema.ts` | Add export for CLI use |
| `packages/collections/src/config/types.ts` | May need `migrations` config section |
| `packages/collections/package.json` | Add `minimist` dependency |
| `packages/collections/tsup.config.ts` | Ensure CLI is built correctly |

---

## 8. Risks and Concerns

| Risk | Severity | Mitigation |
|------|----------|------------|
| Config file loading requires transpilation | Medium | Use `tsx` or `esm` for dynamic imports |
| drizzle-kit/api breaking changes | Low | Pin version, test upgrades |
| Type generation requires JSON Schema | Medium | Use existing config pattern |
| No test infrastructure for CLI | High | Add integration tests |
| Config format not finalized | Medium | Use `ConfigInput` which is extensible |

---

## 9. Estimates

| Aspect | Estimate |
|--------|----------|
| **P0** `push` command | ~300-400 lines, 1 week |
| **P1** `generate` | ~200-300 lines, 3-5 days |
| **P2** `init` + `generate:types` | ~300-400 lines, 1 week |
| **P3** `seed` + `info` | ~200 lines, 3-5 days |
| **Total** | ~1000-1300 lines, ~3-4 weeks |

---

## 10. Dependencies to Add

```json
{
  "dependencies": {
    "drizzle-kit": "^0.31.0"
  },
  "devDependencies": {
    "@types/minimist": "^1.2.5",
    "minimist": "^1.2.8"
  }
}
```

---

## 11. Conclusion

**CLI is ready to implement.** All building blocks exist:

- ✅ `buildRawSchema()` converts collections to raw tables
- ✅ `buildDrizzleTable()` converts raw tables to Drizzle schema
- ✅ `drizzle-kit/api` is available for programmatic use
- ✅ Package.json has `bin` configured

**Implementation order:**
1. P0: `collections push` - Main differentiator
2. P1: `collections generate`
3. P2: `collections init` + `generate:types`
4. P3: `collections seed` + `info`

**Note:** `migrate` is delegated to `drizzle-kit migrate`.

**Key advantage over Payload:** `@deessejs/collections` CLI runs standalone with just Node.js + DB connection. No Next.js required.
