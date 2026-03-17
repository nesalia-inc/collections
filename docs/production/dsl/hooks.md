# Hooks

Hooks allow you to run code at different points in the data lifecycle. They let you transform data, validate input, perform side effects, and modify output.

## Overview

```typescript
import { defineCollection } from '@deessejs/collections'

export const posts = defineCollection({
  slug: 'posts',

  fields: {
    title: { kind: 'text' },
    content: { kind: 'text' },
    published: { kind: 'boolean' }
  },

  hooks: {
    beforeCreate: {
      handler: async ({ data }) => {
        // Transform data before saving
        return {
          ...data,
          title: data.title.trim(),
          createdAt: new Date()
        }
      }
    }
  }
})
```

## Hook Types

### beforeCreate

Runs before a new record is created.

```typescript
beforeCreate: {
  handler: async ({ data }) => {
    // Transform or validate input
    return {
      ...data,
      title: data.title.trim()
    }
  }
}
```

**Use cases:**
- Transform input data
- Add computed fields
- Validate business rules
- Generate IDs or tokens

### afterCreate

Runs after a record is successfully created.

```typescript
afterCreate: {
  handler: async ({ result, data }) => {
    // Side effects
    await sendNotification(result.id)
    await analytics.track('post_created', { id: result.id })
  }
}
```

**Use cases:**
- Send notifications
- Log events
- Trigger webhooks
- Update related records

### beforeUpdate

Runs before a record is updated.

```typescript
beforeUpdate: {
  handler: async ({ data, current }) => {
    // Compare with current data
    if (data.status === 'published' && current.status !== 'published') {
      data.publishedAt = new Date()
    }
    return data
  }
}
```

**Use cases:**
- Validate changes
- Track modifications
- Update related fields

### afterUpdate

Runs after a record is successfully updated.

```typescript
afterUpdate: {
  handler: async ({ result, previous }) => {
    // Notify about changes
    await notifyUser(result.id, 'updated')
  }
}
```

**Use cases:**
- Send notifications
- Clear caches
- Audit changes

### beforeDelete

Runs before a record is deleted.

```typescript
beforeDelete: {
  handler: async ({ current }) => {
    // Prevent deletion under certain conditions
    if (current.status === 'protected') {
      throw new Error('Cannot delete protected record')
    }
  }
}
```

**Use cases:**
- Prevent deletions
- Archive before delete
- Clean up related data

### afterDelete

Runs after a record is successfully deleted.

```typescript
afterDelete: {
  handler: async ({ id }) => {
    // Clean up related data
    await deleteRelatedComments(id)
  }
}
```

**Use cases:**
- Cascade deletes
- Log deletions
- Update counters

### beforeRead

Runs before data is returned from queries.

```typescript
beforeRead: {
  handler: async ({ result }) => {
    // Transform output
    return {
      ...result,
      title: result.title.toUpperCase()
    }
  }
}
```

**Use cases:**
- Transform output
- Hide sensitive fields
- Add computed fields

### afterRead

Runs after data is read from the database (before transformation).

```typescript
afterRead: {
  handler: async ({ result, query }) => {
    // Enrich with additional data
    const author = await getAuthor(result.authorId)
    return {
      ...result,
      author
    }
  }
}
```

**Use cases:**
- Fetch related data
- Add computed properties
- Check permissions

## Hook Context

Each hook receives a context object with relevant data:

### Create Hooks

```typescript
beforeCreate: {
  handler: async ({ data }) => {
    // data: The input data being created
    // context: Additional context (provider, locale, etc.)
    return data
  }
}

afterCreate: {
  handler: async ({ result, data }) => {
    // result: The created record
    // data: The original input data
  }
}
```

### Update Hooks

```typescript
beforeUpdate: {
  handler: async ({ data, current, changes }) => {
    // data: The input data for update
    // current: The current record
    // changes: Only the fields being changed
    return data
  }
}

afterUpdate: {
  handler: async ({ result, previous, changes }) => {
    // result: The updated record
    // previous: The record before update
    // changes: What was changed
  }
}
```

### Delete Hooks

```typescript
beforeDelete: {
  handler: async ({ current }) => {
    // current: The record being deleted
  }
}

afterDelete: {
  handler: async ({ id, previous }) => {
    // id: The ID of deleted record
    // previous: The record before deletion
  }
}
```

### Read Hooks

```typescript
beforeRead: {
  handler: async ({ result }) => {
    // result: The record from database
    return result
  }
}

afterRead: {
  handler: async ({ result, query }) => {
    // result: The record
    // query: The original query params
    return result
  }
}
```

## Async Hooks

All hooks can be async:

```typescript
beforeCreate: {
  handler: async ({ data }) => {
    // Await external calls
    const verified = await verifyEmail(data.email)
    if (!verified) {
      throw new Error('Email not verified')
    }
    return data
  }
}
```

## Returning Data

Hooks can transform data by returning a new object:

```typescript
beforeCreate: {
  handler: async ({ data }) => {
    return {
      ...data,
      slug: slugify(data.title),
      createdAt: new Date()
    }
  }
}
```

To abort an operation, throw an error:

```typescript
beforeDelete: {
  handler: async ({ current }) => {
    if (current.protected) {
      throw new Error('Cannot delete protected record')
    }
  }
}
```

## Multiple Hooks

You can define multiple hooks of the same type:

```typescript
hooks: {
  beforeCreate: [
    {
      handler: async ({ data }) => {
        // First hook
        return { ...data, step: 1 }
      }
    },
    {
      handler: async ({ data }) => {
        // Second hook
        return { ...data, step: 2 }
      }
    }
  ]
}
```

Hooks run in order and each receives the output of the previous.

## Hook Options

Each hook can have additional options:

```typescript
beforeCreate: {
  // Only run for certain conditions
  condition: ({ data }) => data.status === 'published',

  // Handler
  handler: async ({ data }) => {
    return data
  }
}
```

## Error Handling

Throw errors to abort operations:

```typescript
beforeCreate: {
  handler: async ({ data }) => {
    if (!data.title) {
      throw new ValidationError('Title is required')
    }
    return data
  }
}
```

The error will be caught and returned to the caller.

## Accessing Context

```typescript
hooks: {
  beforeCreate: {
    handler: async ({ data, context }) => {
      // context contains:
      // - context.provider: 'pg' | 'mysql' | 'sqlite'
      // - context.locale: Current locale
      // - context.user: Current user (if authenticated)
      // - context.transaction: Active transaction

      if (context.user) {
        data.createdBy = context.user.id
      }

      return data
    }
  }
}
```

## Best Practices

1. **Keep hooks focused** - One responsibility per hook
2. **Use async wisely** - Don't block unnecessarily
3. **Validate early** - Use beforeCreate/beforeUpdate for validation
4. **Handle errors** - Throw meaningful errors
5. **Order matters** - Hooks run in definition order
6. **Avoid infinite loops** - Don't trigger the same operation in after hooks
