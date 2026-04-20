# Type System Implementation Report

## @deessejs/collections Type Safety Analysis

> **Status**: Analysis Complete - Ready for Implementation
> **Date**: 2026-04-20
> **Recommended Approach**: Hybrid (Approach A + Approach B combined)

---

## Executive Summary

**Decision**: Implement **Hybrid Approach** combining both type inference and CLI generation.

### Why Hybrid?

| User Need | Solution |
|-----------|----------|
| I just want to use `createCollections()` and have types work | **Approach A** - No extra steps |
| I need types for external packages | **Approach B** - CLI generates types file |
| I need types in CI/CD validation | **Approach B** - Generated file can be diffed |
| I want to audit/debug types | **Approach B** - Explicit file in VCS |
| I want IDE autocomplete on results | **Approach A** - Types flow through `DbAccess` |

### What This Means

1. **Approach A** is implemented FIRST for core typing (fix `InferCreateType` + explicit casts)
2. **Approach B** is added SECOND for external use cases (CLI command)

Both are complementary, not competing.

---

## Part 1: Current State Analysis

### 1.1 What Exists in the Codebase

#### A. `InferFieldTypes` (hooks/types.ts:17-19)

```typescript
export type InferFieldType<T> = T extends Field<infer U> ? U : never

export type InferFieldTypes<TFields extends Record<string, Field<unknown>>> = {
  [K in keyof TFields]: InferFieldType<TFields[K]>
}
```

**Status**: Works correctly, extracts `T` from `Field<T>`.

#### B. `GetCollectionType` (collections/types.ts:108-116)

```typescript
export type GetCollectionType<T> = T extends Collection<infer TFields>
  ? {
      [K in keyof TFields]: TFields[K] extends Field<infer T>
        ? TFields[K]['required'] extends true
          ? T
          : T | undefined
        : never
    }
  : never
```

**Status**: Properly handles `required` vs optional for read operations.

#### C. `InferCreateType` (operations/database/types.ts:21-29) - HAS BUG

```typescript
export type InferCreateType<TFields extends Record<string, Field<unknown>>> = {
  [K in keyof TFields]: TFields[K] extends Field<infer T>
    ? TFields[K]['required'] extends true
      ? T
      : TFields[K]['defaultValue'] extends (...args: unknown[]) => unknown
        ? TFields[K]['defaultValue']  // BUG: Returns (() => T), not T
        : T | undefined
    : never
}
```

**Bug**: Line 26 returns `TFields[K]['defaultValue']` which evaluates to `(() => T)` when the check passes.

#### D. `CollectionDbMethods<T>` (operations/database/types.ts:224-305)

```typescript
export type CollectionDbMethods<T extends Collection> = {
  findMany: (query?: FindManyQuery<InferFieldTypes<T['fields']>>) => Promise<GetCollectionType<T>[]>
  create: (input: CreateInput<T['fields']>) => Promise<GetCollectionType<T>>
  // ... properly typed
}
```

**Status**: Properly typed but NOT used by `createDbAccess()`.

---

### 1.2 The Core Problem

`createDbAccess()` uses `RawTable` metadata instead of `Collection<S, T>`, so it returns `Record<string, unknown>` instead of properly typed records.

```typescript
// Current (broken)
db.users.findMany()  // Promise<Record<string, unknown>[]

// What we want
db.users.findMany()  // Promise<UserRecord[]>
```

---

## Part 2: Hybrid Implementation Plan

### Phase 1: Core Type Inference (Approach A)

**Goal**: Make `createCollections()` return properly typed `db` object

#### Step 1.1: Fix `InferCreateType` Bug

**File**: `packages/collections/src/operations/database/types.ts`

```typescript
export type InferCreateType<TFields extends Record<string, Field<unknown>>> = {
  [K in keyof TFields]: TFields[K] extends Field<infer T>
    ? TFields[K]['required'] extends true
      ? T
      : TFields[K] extends { defaultValue: (...args: any[]) => infer F }
        ? F  // Extract function return type
        : T | undefined
    : never
}
```

#### Step 1.2: Update `createDbAccess` to Accept Collections

**File**: `packages/collections/src/operations/database/dbAccess.ts`

```typescript
import type { Collection } from '../../collections'
import type { CollectionDbMethods, DbAccess } from './types'

export const createDbAccess = <TCollections extends Collection[]>(
  db: any,
  drizzleSchema: Record<string, any>,
  collections: TCollections
): DbAccess<TCollections> => {
  const access = {} as DbAccess<TCollections>

  for (const collection of collections) {
    const table = drizzleSchema[collection.slug]

    access[collection.slug] = {
      findMany: async (query, ctx) => {
        const result = await findMany(db, table, query, ctx)
        return result as GetCollectionType<typeof collection>[]
      },
      find: async (query, ctx) => {
        // ... paginated version
      },
      findUnique: async (query, ctx) => {
        // ...
      },
      findFirst: async (query, ctx) => {
        // ...
      },
      create: async (input, ctx) => {
        const result = await create(db, table, input.data, ctx)
        return result as GetCollectionType<typeof collection>
      },
      createMany: async (input, ctx) => {
        // ...
      },
      update: async (input, ctx) => {
        // ...
      },
      delete: async (query, ctx) => {
        // ...
      },
      count: async (query, ctx) => {
        // ...
      },
      exists: async (query, ctx) => {
        // ...
      },
    } as CollectionDbMethods<typeof collection>
  }

  return access as DbAccess<TCollections>
}
```

#### Step 1.3: Update `createCollections` to Pass Collections

**File**: `packages/collections/src/runtime/createCollections.ts`

```typescript
// Before (line 323)
const dbAccess = createDbAccess(drizzleDb, drizzleSchema, rawSchema as any)

// After
const dbAccess = createDbAccess(drizzleDb, drizzleSchema, collections)
```

#### Step 1.4: Verify Type Safety

```typescript
// With fixed types, this now works correctly:

const { db } = await createCollections({
  collections: [users, posts],
  db: postgres(url)
})

// ✅ Input validation - TypeScript catches errors
db.users.create({
  data: {
    name: 123,  // ❌ TypeError: number is not assignable to string
    active: 'yes',  // ❌ TypeError: string is not assignable to boolean
  }
})

// ✅ Output typing - TypeScript knows the return type
const result = await db.users.findMany()
result[0].name.toUpperCase()  // ✅ TypeScript knows name is string
```

---

### Phase 2: CLI Type Generation (Approach B)

**Goal**: Generate explicit `collections-types.ts` file for external packages and CI/CD

#### Step 2.1: Create Type Generator Command

**File**: `packages/collections/src/cli/commands/generate-types.ts`

```typescript
import { collection } from '../../collections'
import { z } from 'zod'

interface GenerateTypesOptions {
  configPath?: string
  outputPath?: string
}

const toPascalCase = (str: string): string =>
  str.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')

const fieldToTS = (field: Field<unknown>): string => {
  const schema = field.fieldType.schema

  if (schema instanceof z.ZodString) return 'string'
  if (schema instanceof z.ZodBoolean) return 'boolean'
  if (schema instanceof z.ZodNumber) return 'number'
  if (schema instanceof z.ZodDate) return 'Date'
  if (schema instanceof z.ZodEnum) {
    const values = (schema as z.ZodEnum<any>).options
    return values.map(v => `'${v}'`).join(' | ')
  }
  if (schema instanceof z.ZodArray) return 'unknown[]'
  if (schema instanceof z.ZodObject) return 'Record<string, unknown>'

  return 'unknown'
}

const isFieldRequired = (field: Field<unknown>): boolean => {
  if (field.required) return true
  if (field.defaultValue !== undefined) return true
  return false
}

const generateFields = (fields: Record<string, Field<unknown>>): string[] => {
  const lines: string[] = []

  // Add auto-generated fields
  lines.push('  id: number')
  lines.push('  createdAt: Date')
  lines.push('  updatedAt: Date')

  // Add user fields
  for (const [name, field] of Object.entries(fields)) {
    const tsType = fieldToTS(field)
    const required = isFieldRequired(field)
    const optional = required ? '' : '?'
    lines.push(`  ${name}${optional}: ${tsType}`)
  }

  return lines
}

export const generateTypes = async (options: GenerateTypesOptions = {}) => {
  const { configPath, outputPath = './src/collections-types.ts' } = options

  // Load collections config (for now, load from a config file)
  // This will be enhanced when config loading is implemented
  console.log('Generating types...')
  console.log(`Output: ${outputPath}`)
}
```

#### Step 2.2: Register CLI Command

**File**: `packages/collections/src/cli.ts`

```typescript
import { generateTypes } from './cli/commands/generate-types'

program
  .command('generate:types')
  .description('Generate TypeScript interfaces from collection config')
  .option('-c, --config <path>', 'Path to config file')
  .option('-o, --output <path>', 'Output file path', './src/collections-types.ts')
  .action(generateTypes)
```

#### Step 2.3: Generated Output Example

Running `npx @deessejs/collections generate:types -o ./src/collections-types.ts` produces:

```typescript
// AUTO-GENERATED - DO NOT EDIT
// Run 'npx @deessejs/collections generate:types' after changes

export interface UserRecord {
  id: number
  createdAt: Date
  updatedAt: Date
  name: string
  email: string
  bio?: string
  active: boolean
}

export interface PostRecord {
  id: number
  createdAt: Date
  updatedAt: Date
  title: string
  content?: string
  published: boolean
  viewCount: number
}

export type CollectionRecords = {
  users: UserRecord
  posts: PostRecord
}
```

---

## Part 3: Usage Examples

### With Approach A (Core - Automatic)

```typescript
import { createCollections, postgres, collection, field, f } from '@deessejs/collections'

const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    email: field({ fieldType: f.email(), required: true }),
    active: field({ fieldType: f.boolean(), defaultValue: true }),
  },
})

const { db } = await createCollections({
  collections: [users],
  db: postgres(process.env.DATABASE_URL!),
})

// ✅ Type-safe on input
await db.users.create({
  data: {
    name: 'Alice',
    email: 'alice@example.com',
    // active has defaultValue, so optional
  }
})

// ✅ Type-safe on output
const allUsers = await db.users.findMany()
allUsers[0].name.toUpperCase()  // string ✅
```

### With Approach B (External Packages)

```typescript
// src/collections-types.ts (generated)
export interface UserRecord {
  id: number
  name: string
  email: string
  bio?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

// src/my-external-package/types.ts
import type { UserRecord } from '@myapp/collections-types'

export const processUser = (user: UserRecord) => {
  // Full type safety in external package
  console.log(user.name.toUpperCase())
}
```

---

## Part 4: Implementation Order

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| 1.1 | Fix `InferCreateType` bug | Low | P0 |
| 1.2 | Update `createDbAccess` signature | Medium | P0 |
| 1.3 | Add explicit casts in loop | Medium | P0 |
| 1.4 | Update `createCollections` call | Low | P0 |
| 2.1 | Create `generate-types` command | Medium | P1 |
| 2.2 | Register CLI command | Low | P1 |
| 2.3 | Test with examples | Low | P1 |

**P0 = Must have for MVP, P1 = Nice to have**

---

## Part 5: Breaking Changes

### What Will Change

| Before | After |
|--------|-------|
| `db.users.create()` accepts `Record<string, unknown>` | `db.users.create()` accepts `InferCreateType<TFields>` |
| `db.users.findMany()` returns `Record<string, unknown>[]` | `db.users.findMany()` returns `GetCollectionType<T>[]` |
| No type checking on input | TypeScript catches type errors |

### What Users Must Update

```typescript
// Before - worked because untyped
db.users.create({ data: { name: 123 } })

// After - TypeScript error
db.users.create({ data: { name: 123 } })
// ❌ TypeError: number is not assignable to string
```

---

## Part 6: Technical Debt

| Issue | Status | Fix |
|-------|--------|-----|
| `InferCreateType` bug | Fixed in Phase 1.1 | Use `infer F` pattern |
| `select` returns `FieldType<string>` | Not fixed in MVP | Future improvement |
| `FieldType.type` is generic `string` | Acceptable | Future improvement |

---

## Conclusion

### Summary

| Phase | Approach | What User Gets |
|-------|----------|----------------|
| Phase 1 | A (Inference) | Type-safe `createCollections()` out of the box |
| Phase 2 | B (CLI) | Explicit `collections-types.ts` for external packages |

### Implementation Timeline

1. **Week 1**: Fix `InferCreateType`, update `createDbAccess`, test with examples
2. **Week 2**: Implement `generate:types` CLI, test with examples
3. **Week 3**: Documentation, update README with usage examples

### Next Step

**Proceed with implementation** - Start with Phase 1 tasks.

---

## Appendix A: Corrected Type Patterns

### `InferCreateType` (Fixed)

```typescript
export type InferCreateType<TFields extends Record<string, Field<unknown>>> = {
  [K in keyof TFields]: TFields[K] extends Field<infer T>
    ? TFields[K]['required'] extends true
      ? T
      : TFields[K] extends { defaultValue: (...args: any[]) => infer F }
        ? F
        : T | undefined
    : never
}
```

### `GetCollectionType` (Unchanged - Already Correct)

```typescript
export type GetCollectionType<T> = T extends Collection<infer TFields>
  ? {
      [K in keyof TFields]: TFields[K] extends Field<infer T>
        ? TFields[K]['required'] extends true
          ? T
          : T | undefined
        : never
    }
  : never
```
