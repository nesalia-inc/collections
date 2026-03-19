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

// Decimal for financial data
price: field({ fieldType: f.number({ precision: 10, scale: 2 }) })
```

Options:
- `min` - Minimum value
- `max` - Maximum value
- `precision` - Total digits
- `scale` - Digits after decimal

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
- `through` - Junction table for many-to-many

### Rich Text

For HTML or Markdown content:

```typescript
content: field({ fieldType: f.richtext() })
```

### File

For file uploads (stores file reference/path):

```typescript
avatar: field({ fieldType: f.file() })

attachments: field({ fieldType: f.file({ multiple: true }) })
```

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

## Custom Field Types

You can create your own custom field types for specialized data needs like color pickers, phone numbers, etc.

### Using `fieldType()`

```typescript
import { fieldType, collection, field } from '@deessejs/collections'

// Create a custom field type with validation
const colorPicker = fieldType({
  // The Zod schema for validation
  schema: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color'),

  // How to store in the database
  columnType: 'text'
})

// Or with options for flexibility
const phoneNumber = (countryCode: string = 'US') => fieldType({
  schema: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  columnType: 'text'
})
```

### Using in Collections

```typescript
import { z } from 'zod'

const products = collection({
  slug: 'products',
  fields: {
    name: field({ fieldType: f.text() }),
    // Use your custom field type
    hexColor: field({ fieldType: colorPicker() }),
    // Use parameterized custom field
    phone: field({ fieldType: phoneNumber('FR') })
  }
})
```

### Example: ColorPicker

Here's a complete example of creating and using a custom ColorPicker field:

```typescript
import { fieldType, collection, field, f } from '@deessejs/collections'
import { z } from 'zod'

// Define the custom field type
const ColorPicker = fieldType({
  schema: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  columnType: 'text'
})

// Use it in a collection
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    // Custom accent color field
    accentColor: field({
      fieldType: ColorPicker(),
      defaultValue: '#000000'
    })
  }
})

// The field now has:
// - Validation (must be hex color)
// - Database column (text)
// - TypeScript type (string)
```

See [Providers](../production/providers.md) for more details.