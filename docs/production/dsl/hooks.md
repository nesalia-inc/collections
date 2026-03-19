# Hooks

Hooks allow you to run code at different points in the data lifecycle. They let you transform data, validate input, perform side effects, and modify output.

## Overview

```typescript
import { collection, field, f } from '@deessejs/collections'

export const posts = collection({
  slug: 'posts',

  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  },

  hooks: {
    beforeCreate: [
      async ({ data }) => {
        // Transform data before saving
        return {
          ...data,
          title: data.title.trim(),
          createdAt: new Date()
        }
      }
    ]
  }
})
```

## Hook Types

### beforeCreate

Runs before a new record is created.

```typescript
beforeCreate: [
  async ({ data }) => {
    // Transform or validate input
    return {
      ...data,
      title: data.title.trim()
    }
  }
]
```

**Use cases:**
- Transform input data
- Add computed fields
- Validate business rules
- Generate IDs or tokens

### afterCreate

Runs after a record is successfully created.

```typescript
afterCreate: [
  async ({ result }) => {
    // Side effects
    await sendNotification(result.id)
    await analytics.track('post_created', { id: result.id })
  }
]
```

**Use cases:**
- Send notifications
- Log events
- Trigger webhooks
- Update related records

### beforeUpdate

Runs before a record is updated.

```typescript
beforeUpdate: [
  async ({ data, previousData }) => {
    // Compare with current data
    if (data.status === 'published' && previousData.status !== 'published') {
      data.publishedAt = new Date()
    }
    return data
  }
]
```

**Use cases:**
- Validate changes
- Track modifications
- Update related fields

### afterUpdate

Runs after a record is successfully updated.

```typescript
afterUpdate: [
  async ({ result }) => {
    // Notify about changes
    await notifyUser(result.id, 'updated')
  }
]
```

**Use cases:**
- Send notifications
- Clear caches
- Audit changes

### beforeDelete

Runs before a record is deleted.

```typescript
beforeDelete: [
  async ({ previousData }) => {
    // Prevent deletion under certain conditions
    if (previousData.status === 'protected') {
      throw new Error('Cannot delete protected record')
    }
  }
]
```

**Use cases:**
- Prevent deletions
- Archive before delete
- Clean up related data

### afterDelete

Runs after a record is successfully deleted.

```typescript
afterDelete: [
  async ({ previousData }) => {
    // Clean up related data
    await deleteRelatedComments(previousData.id)
  }
]
```

**Use cases:**
- Cascade deletes
- Log deletions
- Update counters

### beforeRead

Runs before the query executes. Use to modify query parameters:

```typescript
beforeRead: [
  async ({ query }) => {
    // Add global filter
    query.where = { ...query.where, deleted: false }
    return query
  }
]
```

**Use cases:**
- Add global filters
- Modify query parameters
- Enforce permissions at query level

### afterRead

Runs after data is fetched. Use to transform output:

```typescript
afterRead: [
  async ({ result }) => {
    // Transform output
    return result.map(item => ({
      ...item,
      title: item.title.toUpperCase()
    }))
  }
]
```

**Use cases:**
- Transform output
- Hide sensitive fields
- Add computed fields

### Transactionality

Runs after data is read from the database (before transformation).

```typescript
afterRead: [
  async ({ result }) => {
    // Enrich with additional data
    const author = await getAuthor(result.authorId)
    return {
      ...result,
      author
    }
  }
]
```

**Use cases:**
- Fetch related data
- Add computed properties
- Check permissions

## Hook Context

Each hook receives a context object with relevant data:

### Create Hooks

```typescript
beforeCreate: [
  async ({ data }) => {
    // data: The input data being created
    // context: Additional context (provider, locale, etc.)
    return data
  }
]

afterCreate: [
  async ({ result, data }) => {
    // result: The created record
    // data: The original input data
  }
]
```

### Update Hooks

```typescript
beforeUpdate: [
  async ({ data, previousData }) => {
    // data: The input data for update
    // previousData: The current record
    return data
  }
]

afterUpdate: [
  async ({ result, previousData }) => {
    // result: The updated record
    // previousData: The record before update
  }
]
```

### Delete Hooks

```typescript
beforeDelete: [
  async ({ previousData }) => {
    // previousData: The record being deleted
  }
]

afterDelete: [
  async ({ previousData }) => {
    // previousData: The record before deletion
  }
]
```

### Read Hooks

```typescript
beforeRead: [
  async ({ result }) => {
    // result: The record from database
    return result
  }
]

afterRead: [
  async ({ result }) => {
    // result: The record
    return result
  }
]
```

## Async Hooks

All hooks can be async:

```typescript
beforeCreate: [
  async ({ data }) => {
    // Await external calls
    const verified = await verifyEmail(data.email)
    if (!verified) {
      throw new Error('Email not verified')
    }
    return data
  }
]
```

## Returning Data

Hooks can transform data by returning a new object:

```typescript
beforeCreate: [
  async ({ data }) => {
    return {
      ...data,
      slug: slugify(data.title),
      createdAt: new Date()
    }
  }
]
```

To abort an operation, throw an error:

```typescript
beforeDelete: [
  async ({ previousData }) => {
    if (previousData.protected) {
      throw new Error('Cannot delete protected record')
    }
  }
]
```

## Multiple Hooks

You can define multiple hooks of the same type:

```typescript
hooks: {
  beforeCreate: [
    async ({ data }) => {
      // First hook
      return { ...data, step: 1 }
    },
    async ({ data }) => {
      // Second hook
      return { ...data, step: 2 }
    }
  ]
}
```

Hooks run in order and each receives the output of the previous.

## Error Handling

Throw errors to abort operations:

```typescript
beforeCreate: [
  async ({ data }) => {
    if (!data.title) {
      throw new ValidationError('Title is required')
    }
    return data
  }
]
```

The error will be caught and returned to the caller.

## Accessing Context

```typescript
hooks: {
  beforeCreate: [
    async ({ data, db }) => {
      // db contains the Drizzle instance

      if (context.user) {
        data.createdBy = context.user.id
      }

      return data
    }
  ]
}
```

## Transactionality

All hooks run within the same database transaction as the main operation. If a hook fails, the entire operation is rolled back.

```typescript
hooks: {
  beforeCreate: [
    async ({ data, db }) => {
      // This runs in the same transaction as the insert
      // If this throws, the create is rolled back
      const count = await db.count({ where: { type: data.type } })
      if (count > 100) {
        throw new Error('Too many records of this type')
      }
      return data
    }
  ]
}
```

## Bypassing Hooks

For migrations, data seeding, or maintenance scripts, you can skip hooks:

```typescript
// Normal update (with hooks)
await posts.update({ where: { id: 1 }, data: { title: 'New' } })

// Skip hooks
await posts.update({ where: { id: 1 }, data: { title: 'New' }, hooks: false })
```

## Input vs Persisted Types

Hooks that add fields (like `createdAt`) change the data that gets stored. The type system distinguishes:

```typescript
// What you pass to create()
type PostInput = {
  title: string
  content: string
  // createdAt is added by beforeCreate hook
}

// What's stored in the database
type PostPersisted = {
  id: string
  title: string
  content: string
  createdAt: Date
  updatedAt: Date
}
```

## Best Practices

1. **Keep hooks focused** - One responsibility per hook
2. **Use async wisely** - Don't block unnecessarily
3. **Validate early** - Use beforeCreate/beforeUpdate for validation
4. **Handle errors** - Throw meaningful errors
5. **Order matters** - Hooks run in definition order
6. **Avoid infinite loops** - Don't trigger the same operation in after hooks