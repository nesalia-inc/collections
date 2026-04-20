# Gap Analysis: @deessejs/collections vs Payload CMS

## Overview

@deessejs/collections is a **runtime library** that wraps Drizzle ORM, while Payload CMS is a **full-stack CMS framework**. Many Payload features (admin UI, REST/GraphQL APIs, auth, migration tracking) are **out of scope** for @deessejs/collections by design.

---

## 1. Schema Building & Field Types

### What We Have

| Feature | Status |
|---------|--------|
| `collection()`, `field()`, `f.*` builders | ✅ Implemented |
| Auto-generated fields (id, createdAt, updatedAt) | ✅ Implemented |
| Two-layer schema architecture | ✅ Implemented |
| `buildRawSchema()` | ✅ Implemented |
| `buildDrizzleTable()` for PostgreSQL/SQLite | ✅ Implemented |
| Zod validation | ✅ Implemented |
| Basic indexes | ✅ Implemented |
| Foreign key resolution via naming convention | ✅ Implemented |

### What's Missing

| Feature | Severity | Notes |
|---------|----------|-------|
| **FlattenedFields** as central contract | Medium | NOTE: "concept" means single source of truth for field config, NOT Payload's `flattenAllFields` machinery (see senior-review.md AVOID list) |
| **Localization/i18n** | High | No i18n system exists |
| **Blocks field type** | Critical (Phase 2) | Table structure REQUIRED - JSON not acceptable |
| **Array field type** | Medium (Phase 1 OK) | JSON storage is ACCEPTABLE for simple cases |
| **Polymorphic relationships** (`_rels`) | High | No polymorphic relation support |
| **hasMany via junction table** | High | No automatic junction table creation |
| **hasMany number/text tables** (`_numbers`, `_texts`) | Medium | Not implemented |

---

## 2. Migrations

### Decision: No internal migrations table needed

Payload needs `payload-migrations` because:
- It's a **framework** with persistent server
- It distinguishes dev pushes (batch=-1) vs prod migrations
- Its ORM adapter is integrated into the request cycle

@deessejs/collections:
- **Runtime library** - stateless
- `createCollections` doesn't run migrations
- **Delegate entirely to drizzle-kit**

**Verdict: ✅ Correct decision not to implement it**

---

## 3. Hooks System

### What We Have

| Hook | Status |
|------|--------|
| beforeOperation / afterOperation | ✅ |
| beforeCreate/afterCreate | ✅ |
| beforeUpdate/afterUpdate | ✅ |
| beforeDelete/afterDelete | ✅ |
| beforeRead/afterRead | ✅ |

### What's Missing

| Feature | Severity |
|---------|----------|
| **beforeSchemaInit / afterSchemaInit** | Low |
| **Hook execution ordering** | Medium |
| **Async hook support with transaction** | Medium |

---

## 4. Relationships

### What We Have

| Feature | Status |
|---------|--------|
| Direct foreign key relations | ✅ |
| BelongsTo relationship | ✅ |
| Relation field type (`f.relation()`) | ✅ |

### What's Missing

| Feature | Severity |
|---------|----------|
| **Polymorphic relations** (`_rels` table) | High |
| **hasMany via junction table** | High |
| **Self-referential relations** | Medium |
| **Explicit cascade delete** | Medium |
| **Populate/Include (eager loading)** | Medium |

---

## 5. Query Building

### What We Have

| Feature | Status |
|---------|--------|
| `where()` with all operators | ✅ |
| `orderBy()` | ✅ |
| `select()` projection | ✅ |
| Pagination (skip/take) | ✅ |
| Count operation | ✅ |
| All comparison operators | ✅ |
| Like, Contains, StartsWith, EndsWith | ✅ |
| And, Or, Not combinators | ✅ |

### What's Missing

| Feature | Severity |
|---------|----------|
| **Cursor pagination** | Medium |
| **Soft delete filtering** | Medium |
| **Full-text search** | Low |

---

## 6. CLI

### What We Have

| Feature | Status |
|---------|--------|
| `packages/collections/src/cli.ts` | ❌ Placeholder only |

### What's Missing

| Command | Severity | Recommendation |
|---------|----------|----------------|
| `collections init` | Medium | Scaffold project |
| `collections generate` | Medium | Delegate to drizzle-kit |
| `collections migrate` | NOT IMPLEMENTED | Users run `drizzle-kit migrate` directly (per expected-result-cli.md) |
| `collections push` | Low | Delegate to drizzle-kit |
| `collections generate:types` | Low | Nice to have |
| `collections seed` | Low | Nice to have |

---

## 7. Transactions

### What We Have

| Feature | Status |
|---------|--------|
| Transaction support via Drizzle | ✅ |

### What's Missing

| Feature | Severity |
|---------|----------|
| Automatic transaction per operation | Medium |
| Transaction hooks | Low |

---

## 8. Error Handling

### What We Have

| Feature | Status |
|---------|--------|
| PostgreSQL error codes | ✅ |
| Unique constraint errors (23505) | ✅ |
| Not null errors (23502) | ✅ |
| Foreign key errors (23503) | ✅ |

### What's Missing

| Feature | Severity |
|---------|----------|
| Field-level validation errors | Medium |
| Typed errors across layers (Result) | Medium |

---

## Gap Prioritization

### Critical (Should Address Soon)

| Gap | Description | Recommendation |
|-----|-------------|-----------------|
| **hasMany relationships** | Need junction table support | Adopt Payload's junction table pattern |
| **Blocks field type** | Table structure REQUIRED | Critical Phase 2 - JSON NOT acceptable |
| **Array field type** | JSON storage acceptable (Phase 1) | Simple cases - tables later if needed |

### Important (Should Address Eventually)

| Gap | Description |
|-----|-------------|
| **CLI implementation** | Scaffold + drizzle-kit integration |
| **Localization system** | Plan for future |
| **Hook: Schema init** | beforeSchemaInit/afterSchemaInit |
| **Soft delete** | deletedAt optional field |

### Nice to Have (Lower Priority)

| Gap | Description |
|-----|-------------|
| Cursor pagination | Add if needed |
| Populate/Include | When relations are complete |
| Rich text / File upload fields | Accept text/URL storage initially |

### Out of Scope (By Design)

| Feature | Reason |
|---------|--------|
| Admin UI | User code / framework |
| REST/GraphQL API | User code / framework |
| Authentication | User code / framework |
| Migration collection | Delegates to drizzle-kit |
| Dev/Prod schema push | Library doesn't run server |

---

## Patterns to Adopt from Payload

1. **Junction Table Pattern for hasMany** - Create junction tables for hasMany
2. **FlattenedFields concept** - Single source of truth for field configuration (NOT Payload's `flattenAllFields` machinery - senior-review.md warns against adopting that machinery, only the "concept" of centralized field config is relevant)
3. **Change Detection** - Schema fingerprinting to avoid unnecessary operations
4. **Hook System for Schema Init** - beforeSchemaInit/afterSchemaInit for extensibility

### Important Note on schema-and-push.md Section 9

**WARNING**: Section 9 of `reports/payload/schema-and-push.md` contains recommendations to adopt RawTable/RawColumn abstraction and flattenedFields as core contract. These recommendations **CONTRADICT** `senior-review.md` which explicitly lists these as items to **AVOID**:

- **AVOID**: RawTable/RawColumn as Separate Abstraction Layer (senior-review.md lines 192-195)
- **AVOID**: "Don't Flatten Everything" - Payload's `flattenAllFields` machinery (senior-review.md line 226)

The gap-analysis "Patterns to Adopt" section above reflects the senior-review.md decisions, NOT schema-and-push.md Section 9.

## Patterns to Avoid from Payload

1. **RawTable/RawColumn abstraction** - Overkill, 2 layers are sufficient
2. **Table explosion** - No `_numbers`, `_texts` unless full-text search needed
3. **Over-abstracted column types** - Use Drizzle directly
4. **Polymorphic `_rels`** - Complex, prefer explicit relations

---

## Architectural Decision: 3 Layers, Not 5

```
Collection Field Config (User API)
        ↓
buildDrizzleSchema() // Single function, not multi-layer
        ↓
Drizzle pgTable/sqliteTable
        ↓
drizzle-kit push / migrations
```

Payload has 5 layers (Collection → FlattenedFields → RawTable → Drizzle → drizzle-kit). Our 3-layer approach is simpler and justified for a runtime library.
