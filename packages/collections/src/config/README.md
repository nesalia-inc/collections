# Config Module

Top-level configuration for collections.

## Public API

```typescript
import { defineConfig } from '@deessejs/collections'
```

## Usage

```typescript
import { defineConfig, collection, field, f } from '@deessejs/collections'

const config = defineConfig({
  collections: [
    collection({
      slug: 'posts',
      name: 'Blog Posts',
      fields: {
        title: field({ fieldType: f.text() }),
      },
    }),
  ],
})
```

## Types

| Type | Description |
|------|-------------|
| `Config` | Configuration object with `collections` array |

## Files

- `index.ts` - Module exports
- `types.ts` - `Config` interface
- `builder.ts` - `defineConfig` function
