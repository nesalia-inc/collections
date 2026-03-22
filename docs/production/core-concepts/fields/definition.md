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
  fieldType: FieldType,

  // Optional: field is required (default: false)
  required?: boolean,

  // Optional: default value
  defaultValue?: unknown,

  // Optional: unique constraint
  unique?: boolean,

  // Optional: indexed
  indexed?: boolean
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

## Declarative Validation

For common validation rules, use the field options:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    // Min/max length (text)
    title: field({ fieldType: f.text({ minLength: 3, maxLength: 100 }) }),

    // Min/max value (number)
    rating: field({ fieldType: f.number({ min: 1, max: 5 }) }),

    // Unique constraint
    slug: field({ fieldType: f.text(), unique: true }),

    // Required field
    content: field({ fieldType: f.text(), required: true }),

    // Default value
    status: field({ fieldType: f.text(), defaultValue: 'draft' }),

    // Indexed for query performance
    category: field({ fieldType: f.text(), indexed: true })
  }
})
```
