# Expected Result: Polymorphic Relations

## Recommendation: **DEFER**

**Rationale:**
1. Not a critical gap - current pattern covers 90% of use cases
2. Pattern mismatch - Payload's `_rels` pattern is designed for CMS admin UI
3. Complexity vs benefit - Implementing correctly is complex; benefit is marginal for a runtime library
4. Alternative exists - Users can implement at application level with JSON or custom junction tables

---

## 1. Why NOT Payload's `_rels` Pattern

### Payload Pattern (DO NOT Adopt)

```sql
-- Polymorphic _rels Table (DESIGNED FOR ADMIN UI)
CREATE TABLE _rels (
  id SERIAL PRIMARY KEY,
  order INTEGER,
  parent_id UUID NOT NULL,
  path VARCHAR NOT NULL,
  locale VARCHAR,
  -- Dynamic columns based on relationTo
  relationTo_posts_id UUID,
  relationTo_users_id UUID,
  relationTo_categories_id UUID
);
```

**This pattern is problematic for @deessejs/collections because:**

| Aspect | Payload CMS | @deessejs/collections |
|--------|-------------|------------------------|
| Type | Full-stack CMS with admin UI | Runtime library (stateless) |
| Use case | Dynamic content everywhere | Type-safe ORM wrapper |
| Admin UI | Needs to show "all related" | No admin UI |
| Performance | Complex queries acceptable | Must be performant |

### The `_rels` Pattern Creates Problems

1. **Column explosion** - One column per possible `relationTo`
2. **Complex queries** - `SELECT * FROM _rels WHERE relationTo_posts_id = x OR relationTo_users_id = y`
3. **No real FK constraints** - Columns are dynamically nullable
4. **Hard to type** - TypeScript cannot infer exact type

---

## 2. Suggested Alternatives

### Alternative 1: Explicit Junction Tables (RECOMMENDED)

**This is what we already have** - users create junction tables manually:

```typescript
// User defines explicitly
const postTargets = collection({
  slug: 'post-targets',
  fields: {
    postId: field({ fieldType: f.relation({ collection: 'posts' }) }),
    targetId: field({ fieldType: f.uuid() }),  // No direct FK
    targetType: field({ fieldType: f.text() }), // 'posts' | 'pages' | 'products'
  },
})
```

**Pros:** Simple, type-safe, explicit
**Cons:** Boilerplate for users

### Alternative 2: JSON Storage for Simple Polymorphism

```typescript
// Store targets as JSON for simple cases
const comments = collection({
  slug: 'comments',
  fields: {
    // Polymorphic target - stored as JSON
    target: field({
      fieldType: f.json(),  // { type: 'posts', id: 'uuid' }
    }),
    content: field({ fieldType: f.text() }),
  },
})
```

**Pros:** Simple, flexible
**Cons:** No FK enforcement, no referential integrity

### Alternative 3: Auto-Generate Junction Tables per Type

**Better than `_rels` - creates one table per relation type:**

```typescript
// For: relationTo: ['posts', 'pages']
// Creates 2 explicit tables (not one _rels table):
// - comment_post_targets (post_id, comment_id)
// - comment_page_targets (page_id, comment_id)
```

**Pros:** Type-safe, real FK constraints, performant
**Cons:** More tables but explicit

---

## 3. If We Decide to Implement Later

### Suggested API (If Ever)

```typescript
// Recommended structure - NOT the _rels pattern
const comments = collection({
  slug: 'comments',
  fields: {
    // Polymorphic relation - explicitly typed
    target: field({
      fieldType: f.polymorphic({
        types: ['posts', 'pages'],
        // Creates junction tables per type, NOT one _rels table
      })
    }),
    content: field({ fieldType: f.text() }),
  },
})
```

### Generated Tables (If Implemented)

```sql
-- US: one table per relation type (NOT _rels)
CREATE TABLE comment_post_targets (
  id UUID PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE(comment_id, post_id)
);

CREATE TABLE comment_page_targets (
  id UUID PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  UNIQUE(comment_id, page_id)
);
```

**This approach is:**
- Type-safe (each table has its columns)
- Real FK constraints
- Simple queries (no NULL checks)
- More tables but explicit

---

## 4. Decision: Defer

### Rationale

1. **Not critical** - Current relation model covers most practical use cases
2. **Pattern mismatch** - `_rels` is designed for CMS admin UI
3. **Complexity vs benefit** - Implementing correctly is complex
4. **Alternative exists** - Users can implement at application level

### If Implementation Required Later

| File | Change |
|------|--------|
| `fields/builders.ts` | Add `polymorphic()` field type |
| `fields/types.ts` | Add `PolymorphicFieldOptions` |
| `adapter/core/types.ts` | Add `PolymorphicRawColumn` |
| `adapter/core/fieldToRawColumn.ts` | Handle polymorphic column mapping |
| `adapter/core/buildRawSchema.ts` | Handle polymorphic FK resolution |

### Suggested Alternative (Higher Priority)

Instead of polymorphic relations, prioritize:

1. **Auto-generated junction tables** for `hasMany` (addresses many-to-many use case)
2. **Soft delete support** (`deletedAt` field)
3. **Cursor pagination**
4. **Hook system improvements**

---

## 5. Conclusion

**Polymorphic relations (Payload's `_rels` pattern) are NOT recommended for @deessejs/collections.**

**Reasons:**
- Architectural mismatch (runtime library vs full-stack CMS)
- Unjustified complexity for the use case
- Simpler alternatives exist

**If need arises:**
- Store as JSON at application level
- Or implement junction tables per type (not `_rels`)
- Or use `hasMany` pattern with auto-generated junction table

**Priority: LOW** - Defer until a concrete use case justifies it.
