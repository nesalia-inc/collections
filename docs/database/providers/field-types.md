# Field Types and Providers

Field types in Collections are **provider-agnostic**. They define a **column type** (abstract), and providers translate that to the actual database column.

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Field Type                                │
│  title: field({ fieldType: f.text() })                     │
│         └─> provides columnType: 'text'                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Provider                                │
│  Reads columnType 'text'                                    │
│  PostgreSQL  → text                                         │
│  MySQL       → text                                         │
│  SQLite     → text                                         │
└─────────────────────────────────────────────────────────────┘
```

## Built-in Field Types

Field types simply declare their column type:

```typescript
export const posts = collection({
  slug: 'posts',

  fields: {
    // Provides columnType: 'text'
    title: field({ fieldType: f.text() }),

    // Provides columnType: 'text' (maxLength is validation)
    slug: field({ fieldType: f.text({ maxLength: 255 }) }),

    // Provides columnType: 'uuid'
    id: field({ fieldType: f.uuid({ autoGenerate: true }) }),

    // Provides columnType: 'timestamp'
    createdAt: field({ fieldType: f.timestamp() }),

    // Provides columnType: 'json'
    metadata: field({ fieldType: f.json() }),

    // Provides columnType: 'number'
    count: field({ fieldType: f.number() })
  }
})
```

The provider is responsible for translating the column type to the appropriate database column.

## Provider-Specific Options

Some options are provider-specific and only apply when supported:

```typescript
export const posts = collection({
  slug: 'posts',

  fields: {
    // timezone option - only applies to PostgreSQL
    createdAt: timestamp({ timezone: true }),

    // precision option - applies to PostgreSQL and MySQL
    updatedAt: timestamp({ precision: 6 }),

    // mode: 'string' - stores as string instead of Date
    // Useful for SQLite which doesn't have native date types
    loggedAt: timestamp({ mode: 'string' }),

    // scale/precision - for decimal types
    price: number({ precision: 10, scale: 2 })
  }
})
```

## Type Inference Across Providers

TypeScript inference works consistently regardless of provider:

```typescript
export const posts = collection({
  slug: 'posts',

  fields: {
    id: uuid(),        // string (UUID)
    title: text(),     // string
    count: number(),  // number
    metadata: json()  // unknown (or your schema type)
  }
})

// TypeScript type is the same for all providers
type Post = GetCollectionType<typeof posts>
// type Post = {
//   id: string
//   title: string
//   count: number
//   metadata: unknown
//   createdAt: Date
//   updatedAt: Date
// }
```

## Known Limitations

Some features are provider-specific:

| Feature | PostgreSQL | MySQL | SQLite |
|---------|------------|-------|--------|
| Native UUID | ✓ | ✗ (varchar) | ✗ (text) |
| Native JSON | ✓ (jsonb) | ✓ | ✗ (text) |
| Array types | ✓ | ✗ (JSON) | ✗ (JSON) |
| Full-text search | ✓ | ✓ | Limited |
| Time zones | ✓ | ✗ | N/A |

For provider-specific features, use conditional logic in hooks or field options.
