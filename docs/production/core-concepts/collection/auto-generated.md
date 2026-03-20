# Auto-Generated Fields

Every collection automatically gets system fields.

## Overview

Collections automatically include these fields:

```typescript
type Post = GetCollectionType<typeof posts>
// {
//   id: string          // Auto-generated UUID
//   createdAt: Date     // Auto-set on create
//   updatedAt: Date     // Auto-set on update
//   title: string       // Your custom fields
//   ...
// }
```

## Default Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique identifier |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last update timestamp |

## Configuration

Auto-generated fields can be configured:

```typescript
export const posts = collection({
  slug: 'posts',

  // Configure auto-generated fields
  id: {
    type: 'uuid',       // 'uuid' | 'string' | 'number'
    autoGenerate: true
  },

  createdAt: {
    fieldName: 'created_at',  // Rename field
    autoSet: true
  },

  updatedAt: {
    fieldName: 'updated_at',  // Rename field
    autoSet: true,
    onUpdate: true           // Auto-update on changes
  },

  fields: {
    title: field({ fieldType: f.text() })
  }
})
```

## Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | `'uuid' \| 'string' \| 'number'` | ID type |
| `autoGenerate` | `boolean` | Auto-generate on create (for id) |
| `fieldName` | `string` | Customize column name |
| `autoSet` | `boolean` | Auto-set on create (for timestamps) |
| `onUpdate` | `boolean` | Auto-update on changes (for timestamps) |

## ID Types

### UUID (Default)

```typescript
id: { type: 'uuid' }
// Generates: '550e8400-e29b-41d4-a716-446655440000'
```

### String

```typescript
id: { type: 'string' }
// Generates: 'posts_abc123'
```

### Number

```typescript
id: { type: 'number' }
// Generates: 1, 2, 3...
```

## Disable Auto Fields

For immutable tables (like logs), disable auto timestamps:

```typescript
const auditLogs = collection({
  slug: 'audit_logs',

  updatedAt: false,  // Disable auto-updatedAt

  fields: {
    action: field({ fieldType: f.text() }),
    timestamp: field({ fieldType: f.timestamp() })
  }
})
```

## Custom Timestamps

```typescript
createdAt: {
  fieldName: 'created_at',
  autoSet: true
},

updatedAt: {
  fieldName: 'updated_at',
  autoSet: true,
  onUpdate: true  // Automatically updates on every change
}
```
