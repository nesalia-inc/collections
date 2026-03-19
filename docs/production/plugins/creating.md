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