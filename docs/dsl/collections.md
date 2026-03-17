# Collections

Collections are the main organizational unit in Collections. They define a group of related data with fields, hooks, and relationships.

## Defining a Collection

```typescript
import { defineCollection } from '@deessejs/collections'

export const posts = defineCollection({
  slug: 'posts',

  // Collection fields
  fields: {
    title: { kind: 'text' },
    content: { kind: 'text' },
    published: { kind: 'boolean' },
    authorId: { kind: 'uuid', relation: 'users' }
  }
})
```

## Collection Structure

```typescript
type CollectionConfig<
  TSlug extends string,
  TFields extends Record<string, FieldDefinition>
> = {
  // Required: unique identifier
  slug: TSlug

  // Required: field definitions
  fields: TFields

  // Optional: lifecycle hooks
  hooks?: HooksConfig

  // Optional: database indexes
  indexes?: IndexConfig[]

  // Optional: relations to other collections
  relations?: RelationConfig[]
}
```

## Fields

Fields define the structure of your data. See [Fields](./fields.md) for details.

```typescript
export const posts = defineCollection({
  slug: 'posts',
  fields: {
    // Simple field
    title: { kind: 'text' },

    // Field with options
    slug: { kind: 'text', maxLength: 255, unique: true },

    // Field with default
    status: { kind: 'text', default: 'draft' },

    // Relation field
    authorId: { kind: 'uuid', relation: 'users' }
  }
})
```

## Hooks

Hooks allow you to run code at different points in the data lifecycle. See [Hooks](../production/hooks.md) for details.

```typescript
export const posts = defineCollection({
  slug: 'posts',
  fields: {
    title: { kind: 'text' },
    published: { kind: 'boolean' }
  },

  hooks: {
    // Before creating a record
    beforeCreate: {
      handler: async ({ data }) => {
        // Transform data
        return {
          ...data,
          title: data.title.trim(),
          createdAt: new Date()
        }
      }
    },

    // After creating a record
    afterCreate: {
      handler: async ({ result }) => {
        // Send notifications, etc.
        await sendNotification(result.id)
      }
    },

    // Before updating
    beforeUpdate: {
      handler: async ({ data, current }) => {
        // Validate or transform
        return data
      }
    },

    // After reading
    afterRead: {
      handler: async ({ result }) => {
        // Transform output
        return {
          ...result,
          title: result.title.toUpperCase()
        }
      }
    }
  }
})
```

## Indexes

Define database indexes for performance:

```typescript
export const posts = defineCollection({
  slug: 'posts',
  fields: {
    title: { kind: 'text' },
    published: { kind: 'boolean' },
    createdAt: { kind: 'timestamp' }
  },

  indexes: [
    // Single field index
    { fields: ['published'] },

    // Composite index
    { fields: ['published', 'createdAt'] },

    // Unique index
    { fields: ['slug'], unique: true }
  ]
})
```

## Relations

Define relationships to other collections:

```typescript
export const posts = defineCollection({
  slug: 'posts',
  fields: {
    title: { kind: 'text' },
    authorId: { kind: 'uuid' }
  },

  relations: {
    // One-to-many: a user can have many posts
    author: {
      collection: 'users',
      type: 'many',
      from: 'authorId',
      to: 'id'
    }
  }
})

export const users = defineCollection({
  slug: 'users',
  fields: {
    name: { kind: 'text' }
  },

  relations: {
    // Reverse relation (one-to-many)
    posts: {
      collection: 'posts',
      type: 'many',
      from: 'id',
      to: 'authorId'
    }
  }
})
```

## Using Collections

Once defined, collections are used in `defineConfig`:

```typescript
import { defineConfig } from '@deessejs/collections'
import { pgAdapter } from '@deessejs/collections-drizzle'

const posts = defineCollection({ /* ... */ })
const users = defineCollection({ /* ... */ })

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL }),
  collections: [posts, users]
})
```

## Collection API

The config provides a typed API for each collection:

```typescript
// The config provides typed CRUD operations
const { posts, users } = config

// Create
const post = await posts.create({
  title: 'Hello World',
  content: 'My first post',
  authorId: user.id
})

// Find one
const found = await posts.find(post.id)

// Find many
const all = await posts.findMany({
  where: [{ field: 'published', operator: 'eq', value: true }],
  orderBy: [{ field: 'createdAt', direction: 'desc' }],
  limit: 10
})

// Update
const updated = await posts.update(post.id, {
  title: 'Updated Title'
})

// Delete
await posts.delete(post.id)
```

## TypeScript Inference

Collections automatically infer TypeScript types:

```typescript
const posts = defineCollection({
  slug: 'posts',
  fields: {
    title: { kind: 'text' },
    published: { kind: 'boolean' },
    count: { kind: 'number' }
  }
})

// Automatically inferred!
type Post = GetCollectionType<typeof posts>
// {
//   id: string
//   title: string
//   published: boolean
//   count: number
//   createdAt: Date
//   updatedAt: Date
// }
```

## Best Practices

1. **Use descriptive slugs**: `'posts'`, `'user-profiles'`
2. **Define hooks for business logic**: Keep controllers clean
3. **Use indexes for queries**: Add indexes for fields you filter/sort by
4. **Keep collections focused**: One collection per logical entity
5. **Define relations explicitly**: Use the relations config for clarity
