# Fields

Fields are the fundamental building blocks of collections. Each field defines a piece of data in your collection.

## Field Structure

A field is defined using the DSL type system:

```typescript
const posts = defineCollection({
  slug: 'posts',
  fields: {
    // Simple field - uses default options
    title: { kind: 'text' },

    // Field with options
    slug: { kind: 'text', maxLength: 255 },

    // Field with validation
    email: { kind: 'text', format: 'email' }
  }
})
```

## Field Definition

Each field has:

```typescript
type FieldDefinition<TKind extends FieldKind = FieldKind> = {
  // Required: the DSL type
  kind: TKind

  // Optional modifiers
  required?: boolean      // Default: false
  default?: unknown       // Default value
  unique?: boolean        // Create unique index
  indexed?: boolean       // Create index

  // Optional metadata
  label?: string          // Display name
  description?: string    // Help text
  placeholder?: string   // Input placeholder
}
```

## Field Kinds

The available DSL field kinds are:

| Kind | Description |
|------|-------------|
| `'text'` | String values |
| `'number'` | Numeric values (integers or decimals) |
| `'boolean'` | True/false values |
| `'uuid'` | Universally unique identifiers |
| `'timestamp'` | Date and time values |
| `'date'` | Date-only values |
| `'json'` | JSON objects |
| `'enum'` | Predefined set of values |
| `'array'` | Lists of values |
| `'relation'` | References to other collections |
| `'custom'` | Custom field with own validation |

## Required vs Optional

```typescript
// Required field (default)
name: { kind: 'text' }

// Optional field
nickname: { kind: 'text', required: false }

// With default value
status: { kind: 'text', default: 'draft' }
```

## Default Values

```typescript
// Static default
published: { kind: 'boolean', default: false }

// Dynamic default (handled in hooks)
// For timestamps, use 'now'
createdAt: { kind: 'timestamp', default: 'now' }
```

## Indexes

```typescript
// Simple index
title: { kind: 'text', indexed: true }

// Unique index
email: { kind: 'text', unique: true }

// Composite indexes are defined at collection level
const posts = defineCollection({
  slug: 'posts',
  indexes: [
    { fields: ['published', 'createdAt'] }
  ]
})
```

## Field Metadata

```typescript
const posts = defineCollection({
  slug: 'posts',
  fields: {
    title: {
      kind: 'text',
      label: 'Post Title',
      description: 'The main title of your post',
      placeholder: 'Enter a title...'
    }
  }
})
```

## Accessing Fields

Fields are accessed through the collection API:

```typescript
// In hooks or operations
const title = data.title

// TypeScript infers the type
type PostTitle = typeof posts.fields.title
// { kind: 'text', required: boolean, ... }
```

## Field Validation

Validation is handled through the Zod schema, which is automatically derived from the field kind:

```typescript
// The system automatically creates:
// text() → z.string()
// number() → z.number()
// boolean() → z.boolean()
// etc.

// Custom validation can be added via hooks
hooks: {
  beforeCreate: {
    handler: async ({ data }) => {
      if (data.title.length < 5) {
        throw new Error('Title must be at least 5 characters')
      }
      return data
    }
  }
}
```
