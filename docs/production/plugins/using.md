# Using Plugins

Learn how to configure and use plugins in Collections.

## Adding Plugins

Add plugins to your configuration:

```typescript
import { defineConfig } from '@deessejs/collections'
import { somePlugin } from '@some/package'
import { localPlugin } from './plugins/local'

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, users],
  plugins: [
    somePlugin(),
    localPlugin({ option: 'value' })
  ]
})
```

## Plugin Order

Plugins are applied in order:

```typescript
plugins: [
  pluginA(),  // Applied first
  pluginB(), // Applied second
  pluginC()  // Applied last
]
```

Later plugins can override earlier ones.

## Built-in Plugins

### Auth Plugins

Better-Auth plugins are configured via auth:

```typescript
export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts],
  auth: {
    emailAndPassword: { enabled: true },
    plugins: [
      admin(),       // Admin plugin
      organization() // Organization plugin
    ]
  }
})
```

### Custom Plugins

Use community or custom plugins:

```typescript
import { defineConfig } from '@deessejs/collections'
import { seoPlugin } from '@deessejs/plugin-seo'

export const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, products],
  plugins: [
    seoPlugin({
      defaultMeta: { generator: 'My App' }
    })
  ]
})
```

## Plugin Configuration

Pass options to plugins:

```typescript
plugins: [
  myPlugin({
    option1: 'value',
    option2: true
  })
]
```

## Debugging Plugins

List active plugins:

```typescript
console.log(config.plugins)
// [
//   { name: 'logging', ... },
//   { name: 'seo', ... }
// ]
```

## Disabling Plugins

Remove a plugin from the array:

```typescript
// Remove seo plugin
plugins: [
  loggingPlugin,
  // seoPlugin removed
]
```

## Plugin Examples

### Logging

```typescript
import { loggingPlugin } from '@deessejs/plugin-logging'

plugins: [
  loggingPlugin({
    level: 'debug',
    exclude: ['health']
  })
]
```

### SEO

```typescript
import { seoPlugin } from '@deessejs/plugin-seo'

plugins: [
  seoPlugin({
    autoGenerate: true,
    maxTitleLength: 60,
    maxDescriptionLength: 160
  })
]
```

### Versioning

```typescript
import { versioningPlugin } from '@deessejs/plugin-versioning'

plugins: [
  versioningPlugin({
    trackChanges: true,
    keepHistory: 10
  })
]
```