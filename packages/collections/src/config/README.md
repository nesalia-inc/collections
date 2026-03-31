# Config Module

Top-level configuration for collections.

## Public API

```typescript
import { defineConfig } from '@deessejs/collections'
```

## Usage

```typescript
import { defineConfig } from '@deessejs/collections'
import { posts } from '@/collections/posts'

const config = defineConfig({
  collections: { posts },
})

// Access by slug
config.collections.posts
```

## Types

| Type | Description |
|------|-------------|
| `Config` | Configuration object with `collections` record |

## Files

- `index.ts` - Module exports
- `types.ts` - `Config` interface
- `builder.ts` - `defineConfig` function
