# Expected Result: hasMany Junction Tables

## Readiness Assessment: **PARTIALLY READY**

The architecture can be extended to support hasMany via junction tables, but significant modifications are required.

---

## 1. Current Relations State

**Current pattern:**
- `f.relation()` creates a UUID column with direct FK (belongsTo)
- Junction tables are NOT created automatically
- Many-to-many requires manual user creation

**Critical current files:**
- `packages/collections/src/adapter/core/buildRawSchema.ts` - Orchestrates schema building
- `packages/collections/src/adapter/core/collectionToRawTable.ts` - Collection → RawTable conversion
- `packages/collections/src/fields/builders.ts` - Contains `f.relation()`

---

## 2. Expected Changes (No Code)

### 2.1 New Types

**In `adapter/core/types.ts`:**

```typescript
// New: junction table description
type JunctionTable = {
  name: string
  columns: Record<string, RawColumn>
  foreignKeys: Record<string, RawForeignKey>
  indexes: Record<string, RawIndex>
}

// Extension of RawTable to include generated junction tables
type RawTableWithJunctions = RawTable & {
  junctions?: Map<string, JunctionTable>
}
```

### 2.2 Modification of `relation` Field Type

**In `fields/builders.ts`:**

Add `hasMany` option to `f.relation()`:

```typescript
// Proposed API
f.relation({
  collection: 'tags',
  hasMany: true  // Automatically creates junction table
})
```

### 2.3 Modification of `collectionToRawTable`

Detect `hasMany` fields and generate junction tables:

```
posts_hasMany_tags junction table:
├── id (UUID, PK)
├── _order (INTEGER)
├── _parent_id (UUID, FK → posts.id, ON DELETE CASCADE)
├── _parent_path (VARCHAR)  -- for blocks/array
└── value (UUID, FK → tags.id, ON DELETE CASCADE)
```

### 2.4 Modification of `buildRawSchema`

Orchestrate junction table creation in parallel with main tables.

### 2.5 Modification of `createCollections` Return Type

```typescript
// Current return
type CollectionsResult = {
  db: DbAccess
  definitions: CollectionDefinitions
}

// Extended return
type CollectionsResult = {
  db: DbAccess
  definitions: CollectionDefinitions
  junctionTables: Map<string, RawTable>  // NEW
}
```

---

## 3. API Proposal

### 3.1 Usage

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    // Many-to-many relation via auto-generated junction table
    tags: field({
      fieldType: f.relation({
        collection: 'tags',
        hasMany: true
      })
    }),
  },
})

const tags = collection({
  slug: 'tags',
  fields: {
    name: field({ fieldType: f.text() }),
  },
})
```

### 3.2 Generated Tables

```sql
-- Main table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Auto-generated junction table
CREATE TABLE posts_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  _order INTEGER NOT NULL,
  value UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX posts_tags_parent_order ON posts_tags(_parent_id, _order);
```

### 3.3 CRUD Operations

**Create with relations:**
```typescript
// NEW: atomic creation
await db.posts.create({
  data: {
    title: 'My Post',
    tags: [{ id: tag1.id }, { id: tag2.id }]
  }
})
```

**Read with relations:**
```typescript
// NEW: relation loading
const post = await db.posts.findFirst({
  where: eq(posts.id, id),
  include: { tags: true }  // Loads junction
})
```

**Update relations:**
```typescript
await db.posts.update({
  where: eq(posts.id, id),
  data: {
    tags: [{ id: tag3.id }, { id: tag4.id }]  // Replaces old ones
  }
})
```

---

## 4. Public API Impacts

### 4.1 Breaking Changes

| Element | Impact |
|---------|--------|
| `f.relation()` | New signature with options object |
| `CollectionsResult` | New `junctionTables` field |
| `buildRawSchema` | Returns junctionTables Map |
| `db.<collection>.create()` | `data` now accepts nested relations |

### 4.2 Non-Breaking

| Element | Impact |
|---------|--------|
| `f.relation('collection-slug')` | Still works, implies belongsTo |
| Collections without hasMany | No changes |

---

## 5. Risks and Concerns

| Risk | Mitigation |
|------|------------|
| **Implementation complexity** | Split into PRs: types → buildRawSchema → CRUD |
| **Schema migration** | Junction tables are new tables (no data migration) |
| **Query performance** | Automatic index on `_parent_id` and `_order` |
| **Cascade delete** | FK with explicit ON DELETE CASCADE |
| **Item ordering** | `_order` column with timestamp or index default |

---

## 6. Files to Modify

1. `packages/collections/src/fields/builders.ts` - Add `hasMany` option
2. `packages/collections/src/fields/types.ts` - Types for relation options
3. `packages/collections/src/adapter/core/types.ts` - JunctionTable type
4. `packages/collections/src/adapter/core/collectionToRawTable.ts` - Junction table generation
5. `packages/collections/src/adapter/core/buildRawSchema.ts` - Orchestration
6. `packages/collections/src/adapter/postgresql/buildDrizzleTable.ts` - Table building
7. `packages/collections/src/runtime/createCollections.ts` - Extended return type
8. `packages/collections/src/operations/create.ts` - CRUD with relations
9. `packages/collections/src/operations/select/builder.ts` - Include/join for relations
10. `packages/collections/tests/` - Tests for junction tables

---

## 7. Estimates

| Aspect | Estimate |
|--------|----------|
| Lines of code | ~600-800 |
| Files impacted | 10-12 |
| Time | ~2-3 weeks |
| Tests | ~150-200 lines |
