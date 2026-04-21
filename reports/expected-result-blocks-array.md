# Expected Result: Blocks and Array Field Types

## Recommendation

| Field Type | Phase 1 | Phase 2 |
|------------|---------|---------|
| `array` | JSON (current) | `orderedArray` if needed |
| `blocks` | N/A | Table (CRITICAL!) |

---

## 1. Array - JSON Storage Is Acceptable

### Current State

```typescript
// packages/collections/src/fields/builders.ts line 227-234
export const array = <T>(itemType: FieldType<T>): FieldType<T[]> =>
  fieldType({
    type: 'array',
    schema: z.array(itemType.schema),
    buildColumnType: () => simpleColumn('json'),  // JSON storage!
  })({})
```

### JSON Is Acceptable For array Because:

| Criterion | Evaluation |
|-----------|------------|
| Complexity | Low - 1 JSON column |
| Use cases | Tags, simple lists, preferences |
| Read performance | Good (complete JSON parse) |
| Write performance | Good (atomic update) |
| Transactions | Simple (single row) |

### Known Limitations

```typescript
// Current usage - works well for simple cases
const posts = collection({
  slug: 'posts',
  fields: {
    tags: field({ fieldType: f.array(f.text()) }),  // JSON: ['tech', 'news']
  },
})
```

**When JSON becomes problematic:**
- Arrays > 100 items
- Need to query individual items
- Relations between items
- Sorting managed at application level (not scalable)

---

## 2. Blocks - Table Storage Is REQUIRED

### Why JSON Does Not Work For Blocks

| Criterion | Blocks with JSON | Blocks with Table |
|-----------|------------------|-------------------|
| Hierarchy | Impossible | `_path` for tree structure |
| Ordering | Application-side only | `_order` with FK |
| Partial updates | Rewrite entire block | Update 1 block |
| Relations | No FK | FK to other collections |
| Cascade delete | Manual | ON DELETE CASCADE |

### Payload CMS Does NOT Use JSON For Blocks

```
posts (parent table)
posts_blocks (junction: parent + meta)
  ├── id
  ├── _parent_id (FK → posts.id)
  ├── _order
  └── _path

posts_blocks_hero (block type table)
posts_blocks_image
posts_blocks_quote
```

---

## 3. Design Proposal: blocks() Field Type

### Suggested API

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({
      fieldType: f.blocks({
        blockTypes: {
          hero: {
            headline: field({ fieldType: f.text() }),
            subtext: field({ fieldType: f.text() }),
          },
          image: {
            url: field({ fieldType: f.url() }),
            alt: field({ fieldType: f.text() }),
          },
          quote: {
            text: field({ fieldType: f.text() }),
            author: field({ fieldType: f.text() }),
          },
        }
      })
    }),
  },
})
```

### Generated Tables

```sql
-- Parent table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Junction table (meta-blocks)
CREATE TABLE posts_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  _order INTEGER NOT NULL,
  _path TEXT NOT NULL,  -- '0', '0.0', '1.2.5'
  _block_type VARCHAR NOT NULL  -- 'hero', 'image', 'quote'
);

-- Tables per block type
CREATE TABLE posts_blocks_hero (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  _order INTEGER NOT NULL,
  _path TEXT NOT NULL,
  headline VARCHAR,
  subtext VARCHAR
);

CREATE TABLE posts_blocks_image (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  _order INTEGER NOT NULL,
  _path TEXT NOT NULL,
  url VARCHAR,
  alt VARCHAR
);

CREATE TABLE posts_blocks_quote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  _order INTEGER NOT NULL,
  _path TEXT NOT NULL,
  text VARCHAR,
  author VARCHAR
);
```

---

## 4. Schema for Junction Table posts_blocks

### Structure

```typescript
// posts_blocks - stores hierarchical structure
{
  id: uuid (PK),
  _parent_id: uuid (FK → posts.id, ON DELETE CASCADE),
  _order: integer (for drag-drop ordering),
  _path: text (path: "0", "0.0", "1.2.5"),
  _block_type: enum('hero', 'image', 'quote', 'callToAction'),
}
```

### The `_path` Explained

| `_path` | Meaning |
|---------|---------|
| `"0"` | First block at top-level |
| `"0.0"` | First child of first block |
| `"1.2.5"` | 6th child of 3rd child of 2nd block |

**Why `_path`?**
- Allows representing nested blocks (collapsibles, tabs)
- Simpler than recursive FK for arbitrary depth
- Payload CMS uses the same pattern

---

## 5. Implementation Complexity

### Phase 1: Array JSON (EFFORT: Minimal)

| Aspect | Estimate |
|--------|----------|
| Code to write | ~0 lines (already implemented) |
| Tests | Already exists |
| Migration | None |
| **Value** | **Medium** (simple cases covered) |

### Phase 2: Table Blocks (EFFORT: High)

| Aspect | Estimate |
|--------|----------|
| Code to write | ~800-1200 lines |
| Files impacted | 8-12 files |
| Time | ~2-3 weeks |
| Tests | ~200-300 lines |
| **Value** | **High** (Payload-level blocks) |

### Files to Modify

1. `packages/collections/src/fields/builders.ts` - Add `blocks()`
2. `packages/collections/src/fields/types.ts` - Types for blocks
3. `packages/collections/src/column-types/types.ts` - New `blocks` type
4. `packages/collections/src/adapter/core/buildRawSchema.ts` - Child table generation
5. `packages/collections/src/adapter/core/collectionToRawTable.ts` - Blocks field detection
6. `packages/collections/src/adapter/postgresql/buildDrizzleTable.ts` - Child tables
7. `packages/collections/src/operations/database/dbAccess.ts` - CRUD for blocks
8. `packages/collections/src/operations/select/builder.ts` - Select with blocks joins

---

## 6. orderedArray (Optional Phase 3)

### If ordered arrays become necessary

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    // Ordered array with junction table
    tags: field({
      fieldType: f.array(f.text(), { ordered: true })
    }),
  },
})
```

### Generated Table

```sql
CREATE TABLE posts_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  _parent_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  _order INTEGER NOT NULL,
  value VARCHAR(255) NOT NULL
);

CREATE INDEX posts_tags_parent_order ON posts_tags(_parent_id, _order);
```

---

## 7. Timeline Suggestion

```
Phase 1:   JSON for array (DONE - just validate)
Phase 2:   Table blocks (~2-3 weeks if needed)
Phase 3:   orderedArray (~1 week if needed)
```

**Alternative:** Implement blocks as JSON first with migration to tables when actual need arises in production.

---

## 8. Conclusion

| Field Type | Recommendation | Reason |
|------------|----------------|--------|
| `array` | JSON (current) | Sufficient for simple cases |
| `blocks` | Tables (REQUIRED) | Hierarchy, ordering, relations are fundamental |

**JSON for array is acceptable because:**
- Implementation simplicity
- Sufficient for simple use cases
- Possible migration later if needed

**Blocks MUST use tables because:**
- Hierarchy, ordering, and relations are fundamental
- JSON cannot support drag-drop reordering
- Partial updates are a standard user expectation
