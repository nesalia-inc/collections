# Relations

Define relationships between collections.

## Overview

Relations connect collections together, enabling you to link data across tables.

## Using Field Relations

The simplest way to define relations is using `f.relation()` in fields:

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    author: field({ fieldType: f.relation({ to: 'users' }) })
  }
})

export const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() })
  }
})
```

This creates:
- A foreign key column `author` in `posts`
- A one-to-many relationship (one user has many posts)

## Relation Types

### One-to-Many

```typescript
// posts has one author (user)
fields: {
  author: field({ fieldType: f.relation({ to: 'users' }) })
}
```

### Many-to-One (Reverse)

```typescript
// A comment belongs to a post
fields: {
  post: field({ fieldType: f.relation({ to: 'posts' }) })
}
```

### Many-to-Many

Many-to-many relations require a junction table:

```typescript
export const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() })
  }
})

export const tags = collection({
  slug: 'tags',
  fields: {
    name: field({ fieldType: f.text() })
  }
})

// Junction collection
export const postTags = collection({
  slug: 'post_tags',
  fields: {
    post: field({ fieldType: f.relation({ to: 'posts' }) }),
    tag: field({ fieldType: f.relation({ to: 'tags' }) })
  },
  indexes: [
    { fields: ['post', 'tag'], unique: true }
  ]
})
```

## Relation Options

```typescript
fields: {
  author: field({
    fieldType: f.relation({
      to: 'users',
      // Relation type
      kind: 'many-to-one',  // 'many-to-one' | 'one-to-many'
      // Field name in related collection
      fieldName: 'posts',    // Default: collection slug + 's'
      // On delete behavior
      onDelete: 'cascade',   // 'cascade' | 'set-null' | 'restrict'
      // On update behavior
      onUpdate: 'cascade'    // 'cascade' | 'restrict'
    })
  })
}
```

## Querying Related Data

```typescript
// Find posts with author
const result = await db.posts.find({
  include: {
    author: true  // Include related user
  }
})

// Result includes:
// { id: 1, title: 'Post', author: { id: 'user-1', name: 'John' } }
```

## Advanced Relations

For complex relations, use the `relations` property:

```typescript
export const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() })
  },
  relations: [
    {
      name: 'posts',
      to: 'posts',
      kind: 'one-to-many',
      fields: {
        author: 'id'
      }
    }
  ]
})
```

**Note:** The relation defined in `fields` creates the foreign key column. For complex relations (many-to-many with junction table), additional configuration may be needed via the `relations` property.
