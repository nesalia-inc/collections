# Creating Plugins

Learn how to build custom plugins for Collections.

## Plugin Structure

A plugin is an object with optional properties:

```typescript
interface Plugin {
  name: string

  // Add custom field types
  fieldTypes?: Record<string, () => FieldType>

  // Add global hooks
  hooks?: Partial<HooksConfig>

  // Add collections
  collections?: Collection[]

  // Modify config
  onInit?: (config: Config) => void

  // Cleanup
  onDestroy?: (config: Config) => void
}
```

## Basic Example

Create a simple plugin:

```typescript
import { plugin } from '@deessejs/collections'

const loggingPlugin = plugin({
  name: 'logging',

  hooks: {
    beforeOperation: [
      async (context) => {
        console.log(`${context.operation} on ${context.collection}`)
      }
    ]
  }
})
```

## Field Type Plugin

Add custom field types:

```typescript
const richTextPlugin = plugin({
  name: 'rich-text',

  fieldTypes: {
    richtext: () => fieldType({
      kind: 'text',
      schema: z.string()
    })
  }
})

// Usage
const posts = collection({
  slug: 'posts',
  fields: {
    content: field({ fieldType: f.richtext() })
  }
})
```

## Collection Plugin

Add collections automatically:

```typescript
const auditPlugin = plugin({
  name: 'audit',

  collections: [
    collection({
      slug: 'audit_logs',
      fields: {
        action: field({ fieldType: f.text() }),
        entityType: field({ fieldType: f.text() }),
        entityId: field({ fieldType: f.text() }),
        userId: field({ fieldType: f.text() }),
        timestamp: field({ fieldType: f.timestamp() })
      }
    })
  ]
})
```

## Config Modification

Modify configuration at runtime:

```typescript
const versioningPlugin = plugin({
  name: 'versioning',

  onInit: (config) => {
    // Add versioning to all collections
    config.collections.forEach(collection => {
      collection.fields.version = field({
        fieldType: f.number(),
        defaultValue: 1
      })
    })
  }
})
```

## Using Plugins

Register plugins in config:

```typescript
import { defineConfig } from '@deessejs/collections'

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  plugins: [
    loggingPlugin,
    versioningPlugin({ trackChanges: true })
  ]
})
```

## Plugin Options

Plugins can accept configuration:

```typescript
const trackingPlugin = (options: { trackChanges?: boolean } = {}) => {
  return plugin({
    name: 'tracking',

    hooks: options.trackChanges ? {
      afterCreate: [
        async ({ result, db }) => {
          await db.audit_logs.create({
            data: {
              action: 'created',
              entityId: result.id
            }
          })
        }
      ]
    } : {}
  })
}

// Usage
trackingPlugin({ trackChanges: true })
```

## Hook Execution Order

Hooks execute in a predictable order:

1. **Plugin global hooks** - Plugins' `beforeOperation` run first
2. **Plugin collection hooks** - Plugin hooks on specific collections
3. **User collection hooks** - Hooks defined in the collection

```typescript
// Example execution order for beforeCreate
const plugins = [loggingPlugin, seoPlugin]
const collection = { hooks: { beforeCreate: [...] } }

// Order:
// 1. loggingPlugin.hooks?.beforeOperation
// 2. loggingPlugin.hooks?.beforeCreate (if on collection)
// 3. seoPlugin.hooks?.beforeOperation
// 4. seoPlugin.hooks?.beforeCreate
// 5. collection.hooks.beforeCreate
```

### Priority

Use `priority` to control execution order:

```typescript
const plugin = plugin({
  name: 'audit',
  hooks: {
    beforeCreate: [
      {
        priority: 100,  // Higher runs first
        handler: async ({ data }) => {
          // Audit before anything else
          return data
        }
      }
    ]
  }
})
```

## Name Conflicts

The framework detects naming conflicts and throws errors:

```typescript
// Two plugins adding the same collection
const pluginA = plugin({
  name: 'plugin-a',
  collections: [collection({ slug: 'logs', ... })]
})

const pluginB = plugin({
  name: 'plugin-b',
  collections: [collection({ slug: 'logs', ... })]
})

// Error: Collection 'logs' is already defined by plugin-a
```

### Resolving Conflicts

Use unique prefixes or namespaces:

```typescript
const pluginA = plugin({
  name: 'audit',
  collections: [
    collection({ slug: 'audit_logs', ... })  // Namespaced
  ]
})
```

## Field Type Injection

Field types are added to the `f` object dynamically:

```typescript
const richTextPlugin = plugin({
  name: 'rich-text',

  fieldTypes: {
    richtext: () => fieldType({
      kind: 'text',
      schema: z.string()
    })
  }
})

// Available as f.richtext()
const posts = collection({
  fields: {
    content: field({ fieldType: f.richtext() })
  }
})
```

The plugin system uses a Proxy for `f` that checks registered field types from all plugins.

## TypeScript Considerations

When plugins add fields dynamically, TypeScript may not infer them automatically:

```typescript
// Plugin adds metaTitle field
const seoPlugin = plugin({
  name: 'seo',
  onInit: (config) => {
    config.collections.forEach(col => {
      col.fields.metaTitle = field({ fieldType: f.text() })
    })
  }
})

// TypeScript doesn't know about metaTitle in the original definition
type Post = GetCollectionType<typeof posts>
// Post may not include metaTitle

// Workaround: Use type assertion or module augmentation
type PostWithSEO = Post & { metaTitle?: string }
```

For full type support, consider:
1. Using module augmentation
2. Defining extended types explicitly
3. Using `withPlugins()` helper that preserves types

## Global Hooks

The `beforeOperation` hook runs for all operations:

```typescript
const loggingPlugin = plugin({
  name: 'logging',

  hooks: {
    beforeOperation: [
      async (context) => {
        // context.operation: 'create' | 'read' | 'update' | 'delete'
        // context.collection: collection name
        // context.user: current user (if authenticated)
        // context.data: input data
        // context.db: database instance

        console.log(`${context.operation} on ${context.collection} by ${context.user?.id}`)

        return context
      }
    ]
  }
})
```

## Best Practices

1. **Name your plugins** - Use descriptive names for debugging
2. **Document options** - Explain configuration options
3. **Handle cleanup** - Use `onDestroy` for resource cleanup
4. **Test independently** - Ensure plugins work standalone

## Example: Complete Plugin

```typescript
import { plugin, collection, field, f, fieldType } from '@deessejs/collections'
import { z } from 'zod'

export const seoPlugin = plugin({
  name: 'seo',

  // Add SEO fields to collections
  onInit: (config) => {
    config.collections.forEach(col => {
      // Add SEO fields to collections with 'slug' field
      if (col.fields.slug) {
        col.fields.metaTitle = field({
          fieldType: f.text({ maxLength: 60 })
        })
        col.fields.metaDescription = field({
          fieldType: f.text({ maxLength: 160 })
        })
      }
    })
  },

  // Add validation hooks
  hooks: {
    beforeCreate: [
      async ({ data, collection: col }) => {
        // Auto-generate meta fields if empty
        if (col.fields.metaTitle && !data.metaTitle) {
          data.metaTitle = data.title?.substring(0, 60)
        }
        if (col.fields.metaDescription && !data.metaDescription) {
          data.metaDescription = data.content?.substring(0, 160)
        }
        return data
      }
    ]
  }
})
```