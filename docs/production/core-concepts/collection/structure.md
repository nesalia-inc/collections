# Collection Structure

The TypeScript type definition for a collection configuration.

## CollectionConfig Type

```typescript
type CollectionConfig<
  TSlug extends string,
  TFields extends Record<string, FieldDefinition>
> = {
  // Required: unique identifier
  slug: TSlug

  // Optional: human-readable name for UI
  name?: string

  // Optional: admin configuration
  admin?: {
    // Field description for admin UI
    description?: string
  }

  // Optional: permissions for CRUD operations
  permissions?: {
    // Permission to create records
    create?: (context: { user?: User; data: unknown }) => Promise<boolean> | boolean,
    // Permission to read records
    read?: (context: { user?: User; query: unknown }) => Promise<boolean> | boolean,
    // Permission to update records
    update?: (context: { user?: User; data: unknown; current: unknown }) => Promise<boolean> | boolean,
    // Permission to delete records
    delete?: (context: { user?: User; current: unknown }) => Promise<boolean> | boolean
  }

  // Required: field definitions
  fields: TFields

  // Optional: lifecycle hooks
  hooks?: HooksConfig

  // Optional: database indexes
  indexes?: IndexConfig[]

  // Optional: relations to other collections
  relations?: RelationConfig[]

  // Optional: collection-level methods (accessed via db.collection.method())
  extend?: CollectionExtendMethods

  // Optional: instance methods (enrich returned records)
  methods?: CollectionInstanceMethods
}
```

## Type Parameters

| Parameter | Description |
|-----------|-------------|
| `TSlug` | The collection slug (string literal type) |
| `TFields` | Record of field definitions |

## Usage with TypeScript

```typescript
import { collection, field, f, type CollectionConfig } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    published: field({ fieldType: f.boolean() })
  }
})

// TypeScript infers the type
type PostsConfig = CollectionConfig<'posts', {
  title: FieldDefinition
  published: FieldDefinition
}>
```

## Extending the Type

You can extend the collection type for custom properties:

```typescript
import { collection, field, f } from '@deessejs/collections'

// Extend with custom properties
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() })
  }
} as const satisfies collection.Options & {
  // Add custom options
  customOption?: string
})
```
