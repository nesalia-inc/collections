# Relations

Define relationships between collections using `f.relation()`.

## Basic Usage

`f.relation()` creates a UUID field that references another collection's primary key. The relation semantics (belongs-to, has-many, many-to-many) are determined at the **collection level**, not the field level.

```typescript
import { collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    author: field({ fieldType: f.relation() })  // Creates author_id UUID column
  }
})
```

## How It Works

The `f.relation()` field type:
- Creates a `uuid` column in the database
- Stores the target collection's primary key as a string
- The **relation direction** is determined by which collection defines the field

```typescript
// In posts collection - this is a "belongs to" relation
author: field({ fieldType: f.relation() })

// The actual "has many" reverse lookup is handled by the collection system
// based on which collection holds the foreign key
```

## Belongs To (Foreign Key Owner)

When a field with `f.relation()` exists in a collection, that collection **owns the foreign key**:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    // Physical: creates "author_id" column in posts table
    author: field({ fieldType: f.relation() })
  }
})
```

## Has Many (Reverse Lookup)

The reverse "has many" lookup is **virtual** — no column is created. The system automatically provides the reverse relation based on which collection owns the foreign key:

```typescript
const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() })
    // Virtual: automatically provides reverse lookup to posts
    // where posts.author references users.id
  }
})
```

Access the related records through the auto-generated relation methods:

```typescript
const user = await findFirst('users', { where: eq('id', userId) })
const userPosts = await user.posts.findMany()
```

## Many-to-Many (Junction Table)

For many-to-many relationships, create a junction collection explicitly:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    tags: field({ fieldType: f.relation() })
  }
})

const tags = collection({
  slug: 'tags',
  fields: {
    name: field({ fieldType: f.text() })
  }
})

// Junction collection
const postTags = collection({
  slug: 'post_tags',
  fields: {
    post: field({ fieldType: f.relation() }),
    tag: field({ fieldType: f.relation() })
  }
})
```

## Optional Relations

Make a relation optional when the foreign key can be null:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    // Optional: author can be null
    author: field({
      fieldType: f.relation(),
      required: false
    })
  }
})
```

## Relation Field Options

```typescript
field({
  fieldType: f.relation(),
  required?: boolean,      // Whether the relation is required (default: true)
  defaultValue?: string,  // Default UUID for new records
  unique?: boolean,       // Unique constraint (for one-to-one)
  indexed?: boolean       // Index for query performance
})
```

## One-to-One Relations

For one-to-one relationships, add a unique constraint:

```typescript
const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() }),
    profile: field({
      fieldType: f.relation(),
      unique: true  // Ensures one-to-one
    })
  }
})
```

## Self-Referencing Relations

Create hierarchical data (categories, org charts):

```typescript
const categories = collection({
  slug: 'categories',
  fields: {
    name: field({ fieldType: f.text() }),
    parent: field({
      fieldType: f.relation(),
      required: false  // Root categories have no parent
    })
  }
})
```

## Code Generation for Type Safety

For full type safety on relation targets, use code generation:

```bash
pnpm collections generate
```

This generates a `.d.ts` file with collection types. The relation field itself stores UUIDs as strings — the code generator provides the type safety for which collection is being referenced.

## Field Type Reference

```typescript
const relationField = f.relation()
// Returns: FieldTypeBuilder<string>

// With options
field({
  fieldType: f.relation(),
  required: false,
  defaultValue: () => generateUUID()
})
```

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'relation'` | Unique identifier |
| `schema` | `z.string().uuid()` | Validates UUID format |
| `columnType` | `uuid` | Database column type |
