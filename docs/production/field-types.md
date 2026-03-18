# Field Types

Learn about all available field types in @deessejs/collections.

## Overview

Field types define the shape of your data. Each field has:
- A TypeScript type (via Zod)
- A database column type
- Optional validation and constraints

## Primitive Types

### Text

```typescript
import { field, f } from '@deessejs/collections'

const name = field({
  fieldType: f.text()
})
```

Options:
- `required` - Field is required (default: false)
- `unique` - Field must be unique
- `defaultValue` - Default value
- `minLength` / `maxLength` - String length constraints

### Number

```typescript
const age = field({
  fieldType: f.number()
})
```

### Boolean

```typescript
const published = field({
  fieldType: f.boolean()
})
```

### Date

```typescript
const birthDate = field({
  fieldType: f.date()
})
```

### Timestamp

```typescript
const createdAt = field({
  fieldType: f.timestamp()
})
```

## Specialized Types

### Email

```typescript
const email = field({
  fieldType: f.email()
})
```

Includes built-in email validation.

### URL

```typescript
const website = field({
  fieldType: f.url()
})
```

Includes built-in URL validation.

### Select

```typescript
const status = field({
  fieldType: f.select(['draft', 'published', 'archived'])
})
```

Creates an enum field with predefined options.

### JSON

```typescript
const metadata = field({
  fieldType: f.json()
})

// With custom schema
const settings = field({
  fieldType: f.json(z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean()
  }))
})
```

### Array

```typescript
const tags = field({
  fieldType: f.array(z.string())
})

const scores = field({
  fieldType: f.array(z.number())
})
```

## Relations

### Belongs To (One-to-Many)

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    author: field({
      fieldType: f.relation({ to: 'users' })
    })
  }
})
```

### Has Many (One-to-Many reverse)

```typescript
const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() }),
    posts: field({
      fieldType: f.relation({ to: 'posts', many: true })
    })
  }
})
```

### Many-to-Many

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    tags: field({
      fieldType: f.relation({
        to: 'tags',
        many: true,
        through: 'post_tags'  // Junction table
      })
    })
  }
})

const tags = collection({
  slug: 'tags',
  fields: {
    name: field({ fieldType: f.text() })
  }
})
```

## Field Options

### Required

```typescript
const name = field({
  fieldType: f.text(),
  required: true
})
```

### Unique

```typescript
const email = field({
  fieldType: f.email(),
  unique: true
})
```

### Default Value

```typescript
const status = field({
  fieldType: f.select(['draft', 'published']),
  defaultValue: 'draft'
})

const published = field({
  fieldType: f.boolean(),
  defaultValue: false
})
```

### Hidden

```typescript
const password = field({
  fieldType: f.text(),
  hidden: true  // Not returned in API responses
})
```

## Complete Example

```typescript
import { collection, field, f } from '@deessejs/collections'

const posts = collection({
  slug: 'posts',
  name: 'Posts',
  fields: {
    // Text fields
    title: field({
      fieldType: f.text(),
      required: true,
      unique: false
    }),
    slug: field({
      fieldType: f.text(),
      unique: true
    }),
    content: field({
      fieldType: f.text(),
      required: true
    }),

    // Boolean
    published: field({
      fieldType: f.boolean(),
      defaultValue: false
    }),

    // Select
    status: field({
      fieldType: f.select(['draft', 'review', 'published']),
      defaultValue: 'draft'
    }),

    // Date
    publishedAt: field({
      fieldType: f.timestamp()
    }),

    // JSON
    metadata: field({
      fieldType: f.json()
    }),

    // Relations
    author: field({
      fieldType: f.relation({ to: 'users' })
    }),
    tags: field({
      fieldType: f.relation({
        to: 'tags',
        many: true,
        through: 'post_tags'
      })
    })
  }
})
```

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

### Example: Phone Number with Country Code

```typescript
const PhoneNumber = (defaultCountry?: string) => fieldType({
  schema: z.string().min(10).max(15),
  columnType: 'text'
})

const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() }),
    phone: field({
      fieldType: PhoneNumber('US'),
      defaultValue: '+1'
    })
  }
})
```

### With Zod Refine

You can add custom validation logic:

```typescript
const strongPassword = fieldType({
  schema: z.string()
    .min(8)
    .refine(
      (val) => /[A-Z]/.test(val) && /[0-9]/.test(val),
      'Password must contain uppercase and number'
    ),
  columnType: 'text'
})
```

## Summary

| Type | Description |
|------|-------------|
| `f.text()` | String |
| `f.number()` | Integer |
| `f.boolean()` | Boolean |
| `f.date()` | Date only |
| `f.timestamp()` | Date with time |
| `f.email()` | Email with validation |
| `f.url()` | URL with validation |
| `f.select(['a', 'b'])` | Enum |
| `f.json()` | JSON object |
| `f.array(type)` | Array |
| `f.relation({ to: '...' })` | Relation |
| `fieldType({...})` | Custom field type |
