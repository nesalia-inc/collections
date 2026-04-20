# Implementation Steps

## Phase 1: Core Adapter Infrastructure

1. **Create adapter core types** at `src/adapter/core/types.ts`
   - Define `BaseColumn`, `RawColumn`, `RawTable`, `RawIndex`, `RawForeignKey`
   - Include `reference` property and PostgreSQL-specific types (vector, etc.)

2. **Create `toSnakeCase` utility** (commonly available, e.g., `to-snake-case` package)

3. **Create field-to-column mapper** at `src/adapter/core/mapper.ts`
   - Maps `field.fieldType` to `RawColumn`
   - Handles `f.text()`, `f.email()`, `f.number()`, `f.select()`, etc.

4. **Create schema builder** at `src/adapter/core/schemaBuilder.ts`
   - Converts `Collection[]` to `Map<string, RawTable>`
   - Handles auto-generated fields (`id`, `created_at`, `updated_at`)

## Phase 2: Dialect-Specific Implementations

5. **PostgreSQL adapter** at `src/adapter/postgres/index.ts`
   - Implement `PostgresAdapter` with `buildDrizzleTable()`

6. **SQLite adapter** at `src/adapter/sqlite/index.ts`
   - Implement `SQLiteAdapter` with `buildDrizzleTable()`

## Phase 3: CRUD Operations

7. **Implement collection operations** at `src/adapter/operations/`
   - `findMany()`, `findFirst()`, `findUnique()`
   - `create()`, `createMany()`
   - `update()`, `delete()`
   - `count()`, `exists()`

8. **Integrate with hooks system** - All 10 hooks exist in the codebase:
   - `beforeOperation`, `afterOperation`
   - `beforeCreate`, `afterCreate`
   - `beforeUpdate`, `afterUpdate`
   - `beforeDelete`, `afterDelete`
   - `beforeRead`, `afterRead`

## Phase 4: Query Building

9. **Convert WhereNode AST to Drizzle** - Complete operator list in [06-where-to-drizzle.md](06-where-to-drizzle.md)

10. **Convert OrderBy to Drizzle** - Uses `asc()`/`desc()` helpers, see [07-orderby-select.md](07-orderby-select.md)

11. **Implement select/field projection** - Uses generic `select<T>()()` syntax, see [07-orderby-select.md](07-orderby-select.md)

## Phase 5: Main Entry Point

12. **Create `createCollections()`** - Returns `{ db, collections }` with fully implemented db
    - See `createCollections-api-redesign.md` (main report directory)

## Phase 6: Server Integration

13. **Create `collectionsPlugin()`** for @deessejs/server
    - See `rpc-integration-analysis.md` (main report directory)

---

## Key Syntax Reminders

### Collection Definition (from real codebase)

```typescript
collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
  },
})
```

### Field Definition (from real codebase)

```typescript
field({
  fieldType: f.text({ maxLength: 500 }),
  required: true,
  defaultValue: 'hello',
  unique: false,
  indexed: true,
})
```

### Operators (from real codebase)

```typescript
where((p) => [eq(p.status, 'published'), between(p.views, 1, 100)])
orderBy((p) => [desc(p.createdAt)])
select<Post>()(p => ({ id: p.id }))
```
