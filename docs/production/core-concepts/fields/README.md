# Fields

Fields are the fundamental building blocks of collections. Each field defines a piece of data in your collection.

## Overview

```typescript
import { collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    content: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})
```

## Documents

- [Definition](./definition.md) - Field structure and options
- [Required & Optional](./required.md) - Required vs optional fields
- [Defaults](./defaults.md) - Default values
- [Types](./types.md) - All available field types

## Quick Example

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    // Text field
    title: field({ fieldType: f.text() }),

    // With validation
    slug: field({ fieldType: f.text(), unique: true }),

    // With default
    status: field({
      fieldType: f.select(['draft', 'published']),
      defaultValue: 'draft'
    }),

    // Relation
    author: field({ fieldType: f.relation({ to: 'users' }) })
  }
})
```

## Field Options

| Option | Description |
|--------|-------------|
| `fieldType` | The type of the field (required) |
| `required` | Whether the field is required |
| `defaultValue` | Default value when not provided |
| `unique` | Unique constraint |
| `indexed` | Index for query performance |

## Custom Field Types

You can create your own custom field types for specialized data needs. See [Types - Custom Field Types](./types.md#custom-field-types) for details.
