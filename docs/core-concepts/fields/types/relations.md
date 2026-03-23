# Relations

Define relationships between collections.

## Belongs To (One-to-Many)

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})
```

## Has Many (One-to-Many reverse)

```typescript
const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() }),
    posts: field({
      fieldType: f.relation({ to: 'posts', many: true })
    })
  }
})
```

## Many-to-Many

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    tags: field({
      fieldType: f.relation({
        to: 'tags',
        many: true,
        through: 'post_tags'  // Junction table
      })
    })
  }
})

const tags = collection({
  slug: 'tags',
  fields: {
    name: field({ fieldType: f.text() })
  }
})
```

**Note:** When `many: true` is set without a `through` table, it creates a reverse relation (e.g., "user has many posts"). For true many-to-many relations, use the `through` option.

## Relation Options

```typescript
field({
  fieldType: f.relation({
    // Required: target collection
    to: 'users',

    // Optional: many-to-many relationship
    many?: boolean,

    // Optional: junction table for many-to-many
    through?: string,

    // Optional: disambiguate when multiple relations exist
    on?: 'author' | 'validator',

    // Optional: foreign key column name
    fieldName?: 'author_id',

    // Optional: referential integrity
    onDelete?: 'cascade' | 'set null' | 'restrict',

    // Optional: update behavior
    onUpdate?: 'cascade' | 'restrict'
  })
})
```

## Virtual vs Physical Relations

- **Belongs To** is **physical** - creates a foreign key column in the table
- **Has Many** is **virtual** - just a view on the other table, no column created

```typescript
// Physical relation - creates "author_id" column
author: field({ fieldType: f.relation({ to: 'users' }) })

// Virtual relation - no column created
posts: field({ fieldType: f.relation({ to: 'posts', many: true }) })
```

## Disambiguating Relations

When a collection has multiple relations to the same target, use the `on` option:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    // First relation to users (as author)
    author: field({
      fieldType: f.relation({ to: 'users', on: 'author' })
    }),

    // Second relation to users (as validator)
    validator: field({
      fieldType: f.relation({ to: 'users', on: 'validator' })
    })
  }
})

const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() }),
    // Disambiguate which relation to use
    authoredPosts: field({
      fieldType: f.relation({ to: 'posts', many: true, on: 'author' })
    }),
    validatedPosts: field({
      fieldType: f.relation({ to: 'posts', many: true, on: 'validator' })
    })
  }
})
```

## Referential Integrity

Control what happens when related records are deleted or updated:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    author: field({
      fieldType: f.relation({
        to: 'users',
        onDelete: 'cascade',     // Delete posts when author is deleted
        onUpdate: 'cascade'     // Update author_id when user ID changes
      })
    })
  }
})
```

| Option | Behavior |
|--------|----------|
| `cascade` | Automatically delete/update related records |
| `set null` | Set foreign key to NULL (requires nullable relation) |
| `restrict` | Prevent deletion/update if related records exist |
