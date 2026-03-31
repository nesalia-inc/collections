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
  collections: [posts],
})

// Access by slug
config.collections.posts
```

## Types

| Type | Description |
|------|-------------|
| `ConfigInput` | Input config with `collections` as array |
| `Config` | Output config with `collections` as record |

## Files

- `index.ts` - Module exports
- `types.ts` - `Config` interface
- `builder.ts` - `defineConfig` function
