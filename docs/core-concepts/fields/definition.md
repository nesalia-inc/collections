# Field Definition

Learn how to define fields with the `field()` function.

## Field Structure

A field is defined using the `field()` function:

```typescript
import { collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    // Simple field
    title: field({ fieldType: f.text() }),

    // Field with options
    slug: field({ fieldType: f.text(), maxLength: 255 }),

    // Field with validation
    email: field({ fieldType: f.email() })
  }
})
```

## Field Options

Each field has:

```typescript
field({
  // Required: the field type
  fieldType: FieldType<T>,

  // Optional: field is required (default: false)
  required?: boolean,

  // Optional: default value (static or function)
  defaultValue?: T | (() => T),

  // Optional: unique constraint (creates index automatically)
  unique?: boolean,

  // Optional: indexed for query performance
  indexed?: boolean
})
```

## Default Values

Static values or dynamic functions:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    // Static default
    status: field({ fieldType: f.text(), defaultValue: 'draft' }),

    // Dynamic default (function)
    publishedAt: field({
      fieldType: f.timestamp(),
      defaultValue: () => new Date()
    }),

    // Dynamic with condition
    views: field({
      fieldType: f.number(),
      defaultValue: () => Math.floor(Math.random() * 1000)
    })
  }
})
```

## Indexes

```typescript
// Simple index
title: field({ fieldType: f.text(), indexed: true })

// Unique index
email: field({ fieldType: f.text(), unique: true })

// Composite indexes are defined at collection level
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  },
  indexes: [
    { fields: ['published', 'createdAt'] }
  ]
})
```

## Accessing Fields

Fields are accessed through the collection API:

```typescript
// In hooks or operations
const title = data.title

// TypeScript infers the type
type PostTitle = typeof posts.fields.title
```

## Field Validation

Validation is handled through the field type's built-in validation:

```typescript
// email() validates the format automatically
email: field({ fieldType: f.email() })

// Custom validation can be added via hooks
hooks: {
  beforeCreate: [
    async ({ data }) => {
      if (data.title.length < 5) {
        throw new Error('Title must be at least 5 characters')
      }
      return data
    }
  ]
}
```

## Type Safety

TypeScript validates the default value matches the field type:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    // Error: number is not assignable to string
    title: field({
      fieldType: f.text(),
      defaultValue: 123
    }),

    // Correct: defaultValue matches fieldType
    views: field({
      fieldType: f.number(),
      defaultValue: 0
    })
  }
})
```
