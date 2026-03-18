# Field Types

Field types define the data types available in Collections. Each field type combines validation with database column mappings.

## Built-in Field Types

Collections provides these built-in field types accessed via `f`:

### Text

```typescript
import { collection, field, f } from '@deessejs/collections'

// Basic text
name: field({ fieldType: f.text() })

// With length constraints
slug: field({ fieldType: f.text({ minLength: 3, maxLength: 100 }) })

// Unique text
email: field({ fieldType: f.text(), unique: true })

// Indexed text
title: field({ fieldType: f.text(), indexed: true })
```

Options:
- `minLength` - Minimum length
- `maxLength` - Maximum length

### Number

```typescript
// Integer (default)
count: field({ fieldType: f.number() })

// With range
rating: field({ fieldType: f.number({ min: 1, max: 5 }) })
```

Options:
- `min` - Minimum value
- `max` - Maximum value

### Boolean

```typescript
// Basic boolean
published: field({ fieldType: f.boolean() })

// With default
isActive: field({ fieldType: f.boolean(), defaultValue: false })
```

### UUID

```typescript
// Auto-generated UUID (recommended)
id: field({ fieldType: f.uuid({ autoGenerate: true }) })

// UUID field (manual input)
userId: field({ fieldType: f.uuid() })
```

Options:
- `autoGenerate` - Auto-generate using database capabilities

### Timestamp

```typescript
// Basic timestamp
createdAt: field({ fieldType: f.timestamp() })

// With timezone (PostgreSQL only)
updatedAt: field({ fieldType: f.timestamp({ withTimezone: true }) })
```

Options:
- `withTimezone` - Include timezone information

### Date

```typescript
// Date only (no time)
birthday: field({ fieldType: f.date() })
```

### JSON

```typescript
// Basic JSON
metadata: field({ fieldType: f.json() })
```

### Enum

```typescript
// Basic select (enum)
status: field({ fieldType: f.select(['draft', 'published', 'archived']) })

// With TypeScript type
role: field({ fieldType: f.select(['user', 'admin', 'moderator'] as const) })
```

### Relation

```typescript
// Relation to another collection
author: field({ fieldType: f.relation({ to: 'users' }) })

// Relation with multiple
posts: field({ fieldType: f.relation({ to: 'posts', many: true }) })
```

Options:
- `to` - Target collection slug
- `many` - Whether it's a one-to-many relation

## Field Type Composition

Field types can be composed using `f` helpers:

```typescript
// Use select for enums
status: field({ fieldType: f.select(['active', 'inactive']) })

// Use relation for references
author: field({ fieldType: f.relation({ to: 'users' }) })
```

## Database Mapping

Field types are translated to database-specific columns:

| Field Type | PostgreSQL | SQLite |
|------------|------------|--------|
| `f.text()` | text | text |
| `f.number()` | integer | integer |
| `f.uuid()` | uuid | text |
| `f.timestamp()` | timestamptz | text |
| `f.json()` | jsonb | text |
| `f.boolean()` | boolean | integer |

See [Providers](../production/providers.md) for more details.