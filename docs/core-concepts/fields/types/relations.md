# Relations

Define relationships between collections.

## Belongs To (Foreign Key Owner)

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

Creates a foreign key column `author_id` in the `posts` table.

## Has Many (Virtual / Reverse Lookup)

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

Virtual relation - no column created. The system queries `posts` where `author_id` matches.

## Many-to-Many (Junction Table)

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    tags: field({
      fieldType: f.relation({
        to: 'tags',
        many: true,
        through: 'post_tags'
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

The system creates a junction table `post_tags` with columns `post_id` and `tag_id`.

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
    // Must be a key of the target collection's fields
    on?: 'author' | 'validator',

    // Optional: foreign key column name in database
    fieldName?: 'author_id',

    // Optional: referential integrity
    onDelete?: 'cascade' | 'set null' | 'restrict',

    // Optional: update behavior
    onUpdate?: 'cascade' | 'restrict'
  })
})
```

## Understanding the `on` Option

The `on` option is a pointer to a field in the target collection that holds the foreign key:

```typescript
// posts collection has this field:
author: field({ fieldType: f.relation({ to: 'users' }) })

// users collection uses 'on' to reference that field:
posts: field({
  fieldType: f.relation({ to: 'posts', many: true, on: 'author' })
})
```

This is equivalent to the SQL query:
```sql
SELECT * FROM posts WHERE author_id = [USER_ID];
```

The `on` value must be a valid field key from the target collection.

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
