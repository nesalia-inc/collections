# Field Types

Field types define the data types available in the DSL. Each field type combines a Zod schema for validation with provider-specific database column mappings.

## Built-in Field Types

Collections provides these built-in field types:

### Text

```typescript
import { text } from '@deessejs/collections/fields'

// Basic text
name: text()

// With length constraints
slug: text({ min: 3, max: 100 })

// Unique text
email: text({ unique: true })

// Indexed text
title: text({ indexed: true })
```

Options:
- `min` - Minimum length
- `max` - Maximum length
- `unique` - Create unique index
- `indexed` - Create index

### Number

```typescript
import { number } from '@deessejs/collections/fields'

// Integer (default)
count: number()

// Integer only
quantity: number({ integer: true })

// Decimal
price: number({ precision: 10, scale: 2 })

// With range
rating: number({ min: 1, max: 5 })
```

Options:
- `integer` - Only allow whole numbers
- `min` - Minimum value
- `max` - Maximum value
- `precision` - Total digits
- `scale` - Digits after decimal

### Boolean

```typescript
import { boolean } from '@deessejs/collections/fields'

// Basic boolean
published: boolean()

// With default
isActive: boolean({ default: false })
```

### UUID

```typescript
import { uuid } from '@deessejs/collections/fields'

// Auto-generated UUID (recommended)
id: uuid({ autoGenerate: true })

// UUID field (manual input)
userId: uuid()
```

Options:
- `autoGenerate` - Auto-generate using database capabilities

### Timestamp

```typescript
import { timestamp } from '@deessejs/collections/fields'

// Basic timestamp
createdAt: timestamp()

// With timezone (PostgreSQL only)
updatedAt: timestamp({ timezone: true })

// With precision
loggedAt: timestamp({ precision: 6 })
```

Options:
- `timezone` - Include timezone information
- `precision` - Fractional seconds precision (0-6)
- `defaultNow` - Auto-set to current time

### Date

```typescript
import { date } from '@deessejs/collections/fields'

// Date only (no time)
birthday: date()
```

### JSON

```typescript
import { json } from '@deessejs/collections/fields'

// Basic JSON
metadata: json()

// With schema
settings: json(z.object({
  theme: z.enum(['light', 'dark']),
  notifications: z.boolean()
}))
```

### Enum

```typescript
import { enumField } from '@deessejs/collections/fields'

// Basic enum
status: enumField(['draft', 'published', 'archived'])

// With TypeScript type
role: enumField(['user', 'admin', 'moderator'] as const)
```

### Array

```typescript
import { array } from '@deessejs/collections/fields'

// String array
tags: array(z.string())

// Number array
scores: array(z.number())

// Enum array
categories: array(z.enum(['tech', 'design', 'business']))
```

### Relation

```typescript
import { relation } from '@deessejs/collections/fields'

// One-to-many (many posts can have one author)
authorId: relation('users', { type: 'many' })

// One-to-one (one user has one profile)
profileId: relation('profiles', { type: 'one' })

// With through table (many-to-many)
tags: relation('tags', { through: 'postTags' })
```

Options:
- `type` - `'one'` or `'many'`
- `through` - Junction table for many-to-many

## Creating Custom Field Types

You can create your own field types using `fieldType`:

```typescript
import { fieldType } from '@deessejs/collections'

// Simple custom field
export const slug = fieldType({
  kind: 'text',

  schema: z.string()
    .regex(/^[a-z0-9-]+$/, 'Must contain only lowercase letters, numbers, and hyphens')
    .min(3)
    .max(100)
})

// Parameterized field
export const range = (min: number, max: number) => fieldType({
  kind: 'number',

  schema: z.number()
    .min(min)
    .max(max)
})

// Usage
level: range(1, 100)
```

## Field Type Composition

Field types can be composed:

```typescript
// Extend an existing field
const verifiedEmail = email.extend({
  verified: () => ({
    schema: z.string().email().refine(
      async (val) => await checkVerified(val),
      'Email must be verified'
    )
  })
})

// Compose multiple validations
const strictName = text().compose(
  z.string().min(2),
  z.string().max(50),
  z.string().regex(/^[A-Z]/)
)
```

## Provider Translation

Field types are translated to database-specific columns by the provider:

| Field Type | PostgreSQL | MySQL | SQLite |
|------------|------------|-------|--------|
| `text()` | `text` | `text` | `text` |
| `number()` | `integer` | `int` | `integer` |
| `uuid()` | `uuid` | `varchar(36)` | `text` |
| `timestamp()` | `timestamptz` | `datetime` | `text` |
| `json()` | `jsonb` | `json` | `text` |
| `boolean()` | `boolean` | `tinyint(1)` | `integer` |

See [Providers](../production/providers.md) for more details.
