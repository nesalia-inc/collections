# Default Values

Set default values for fields.

## Static Defaults

```typescript
// Boolean default
published: field({ fieldType: f.boolean(), defaultValue: false })

// String default
status: field({ fieldType: f.text(), defaultValue: 'draft' })

// Number default
priority: field({ fieldType: f.number(), defaultValue: 1 })

// Select default
visibility: field({
  fieldType: f.select(['public', 'private']),
  defaultValue: 'private'
})
```

## Dynamic Defaults

For dynamic defaults (like timestamps), use hooks:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    createdAt: field({ fieldType: f.timestamp() })
  },
  hooks: {
    beforeCreate: [
      async ({ data }) => {
        // Set dynamic default
        if (!data.createdAt) {
          data.createdAt = new Date()
        }
        return data
      }
    ]
  }
})
```

## Common Patterns

### Auto-slug from title

```typescript
hooks: {
  beforeCreate: [
    async ({ data }) => {
      if (!data.slug && data.title) {
        data.slug = data.title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      }
      return data
    }
  ]
}
```

### UUID Generation

```typescript
hooks: {
  beforeCreate: [
    async ({ data }) => {
      if (!data.id) {
        data.id = crypto.randomUUID()
      }
      return data
    }
  ]
}
```

### Conditional Defaults

```typescript
hooks: {
  beforeCreate: [
    async ({ data, user }) => {
      // Set status based on user role
      if (!data.status) {
        data.status = user?.role === 'admin' ? 'published' : 'draft'
      }
      return data
    }
  ]
}
```
