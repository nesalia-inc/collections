# Plugins

Extend the functionality of Collections with plugins.

## Overview

Plugins add capabilities to your Collections configuration:
- New field types
- Custom hooks
- Additional collections
- Authentication extensions
- Admin UI features

## Documents

- [Creating Plugins](./creating.md) - How to build custom plugins
- [Using Plugins](./using.md) - How to configure and use plugins

## Quick Example

```typescript
import { defineConfig } from '@deessejs/collections'
import { myCustomPlugin } from './plugins/my-plugin'

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, users],
  plugins: [
    myCustomPlugin({
      option1: 'value'
    })
  ]
})
```

## Plugin Types

### Field Type Plugins

Add new field types:

```typescript
const colorPickerPlugin = {
  name: 'color-picker',
  fieldTypes: {
    colorPicker: () => fieldType({
      kind: 'text',
      schema: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
    })
  }
}
```

### Hook Plugins

Add global hooks:

```typescript
const loggingPlugin = {
  name: 'logging',
  hooks: {
    beforeOperation: [
      async (context) => {
        console.log(`Operation: ${context.operation}`)
      }
    ]
  }
}
```

### Collection Plugins

Add collections automatically:

```typescript
const auditPlugin = {
  name: 'audit',
  collections: [
    collection({
      slug: 'audit_logs',
      fields: {
        action: field({ fieldType: f.text() }),
        timestamp: field({ fieldType: f.timestamp() })
      }
    })
  ]
}
```

## Summary

| Plugin Type | Purpose |
|-------------|---------|
| Field Types | Add new data types |
| Hooks | Add global lifecycle logic |
| Collections | Auto-add collections |
| Auth | Extend authentication |
| Admin | Add admin features |

See [Creating Plugins](./creating.md) for detailed documentation.