# Critical Files for Implementation

## In @deessejs/collections (already implemented)

| File | Purpose |
|------|---------|
| `packages/collections/src/collections/collection.ts` | `collection()` function |
| `packages/collections/src/fields/field.ts` | `field()` function |
| `packages/collections/src/fields/f.ts` | `f` object with all field types |
| `packages/collections/src/operations/where/builder.ts` | `where()`, `eq()`, `ne()`, etc. |
| `packages/collections/src/operations/order-by/builder.ts` | `orderBy()`, `asc()`, `desc()` |
| `packages/collections/src/operations/select/builder.ts` | `select()` |
| `packages/collections/src/operations/database/types.ts` | `CollectionDbMethods<T>`, `DbAccess<T>` |
| `packages/collections/src/collections/hooks/types.ts` | Hook types (`beforeCreate`, etc.) |

## To Implement (adapter)

| File | Purpose |
|------|---------|
| `src/adapter/core/types.ts` | `BaseColumn`, `RawColumn`, `RawTable` types |
| `src/adapter/core/mapper.ts` | `fieldToRawColumn()` conversion |
| `src/adapter/core/schemaBuilder.ts` | `buildRawSchema()` |
| `src/adapter/queries/whereToDrizzle.ts` | WhereNode → Drizzle SQL |
| `src/adapter/queries/orderByToDrizzle.ts` | OrderBy → Drizzle order |
| `src/adapter/queries/selectToDrizzle.ts` | Select → Drizzle columns |
| `src/adapter/postgres/buildDrizzleTable.ts` | PostgreSQL conversion |
| `src/adapter/sqlite/buildDrizzleTable.ts` | SQLite conversion |
| `src/adapter/operations/create.ts` | Create operation |
| `src/adapter/operations/findMany.ts` | FindMany operation |
| `src/runtime/createCollections.ts` | Main entry point |

## Reference (from Payload CMS)

| File | Purpose |
|------|---------|
| `temp/payload/packages/drizzle/src/schema/buildRawSchema.ts` | Reference implementation |
| `temp/payload/packages/drizzle/src/schema/buildTable.ts` | Table building |
