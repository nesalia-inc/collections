# DSL Documentation

This section describes the Domain-Specific Language (DSL) for defining data models in Collections.

## Overview

Collections provides a declarative DSL for defining:
- **Collections**: Groups of related data
- **Fields**: Individual data points within collections
- **Field Types**: The data types available

## Documents

- [Collections](./collections.md) - Defining data collections
- [Fields](./fields.md) - Field structure and options
- [Field Types](./field-types.md) - Available data types
- [Operations](./operations.md) - CRUD operations on collections
- [Virtual Collections](./virtual-collections.md) - Auto-generated collections (auth tables)

## Quick Example

```typescript
import { collection, field, f } from '@deessejs/collections'

export const posts = collection({
  slug: 'posts',

  fields: {
    // Text field
    title: field({ fieldType: f.text() }),

    // Boolean field
    published: field({ fieldType: f.boolean(), defaultValue: false })
  },

  hooks: {
    beforeCreate: [
      async ({ data }) => {
        return { ...data, createdAt: new Date() }
      }
    ]
  }
})
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Collection** | A group of related data with fields |
| **Field** | A single data point with a type |
| **Field Type** | The kind of data (text, number, etc.) |
| **Hook** | Lifecycle callbacks for CRUD operations |
| **Index** | Database index for query performance |
| **Relation** | Links between collections |

## Next Steps

- Read [Collections](./collections.md) to get started
- Explore [Field Types](./field-types.md) for all available types
- Learn about [Hooks](../hooks.md) for business logic
