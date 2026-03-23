# Field Types

Learn about all available field types in @deessejs/collections.

## Overview

Field types define the shape of your data. Each field has:
- A TypeScript type (via Zod)
- A database column type
- Optional validation and constraints

## Field Type Factory

The `f` object provides predefined field types:

```typescript
import { field, f } from '@deessejs/collections'

const name = field({
  fieldType: f.text()
})
```

## Custom Field Types

Use `fieldType` to create custom field types with full control:

```typescript
import { field, fieldType, z } from '@deessejs/collections'

// Simple custom field
const customText = fieldType({
  type: 'text',
  columnType: 'varchar(255)',
  schema: z.string().min(1).max(255)
})

// Advanced custom field with options
const customField = fieldType({
  type: 'custom',
  columnType: 'text',
  schema: z.string(),
  options: {
    transform: (value) => value?.trim(),
    prepare: (value) => value ?? null
  }
})

// Usage
const myField = field({
  fieldType: customText
})
```

### fieldType Function Signature

```typescript
const fieldType = <T extends z.ZodType>(
  config: FieldTypeConfig<T>
) => FieldType

type FieldTypeConfig<T extends z.ZodType> = {
  type: string
  columnType: string
  schema: T
  options?: {
    transform?: (value: z.infer<T>) => z.infer<T>
    prepare?: (value: z.infer<T>) => z.infer<T>
    validate?: (value: z.infer<T>) => boolean
  }
}
```

### fieldType Implementation

```typescript
import { z } from 'zod'

/**
 * Creates a custom field type with full control over schema and behavior
 */
const fieldType = <T extends z.ZodType>(
  config: FieldTypeConfig<T>
): FieldType => ({
  // Type identifier for serialization/debugging
  type: config.type,

  // Database column type (SQL column definition)
  columnType: config.columnType,

  // Zod schema for validation and type inference
  schema: config.schema,

  // Optional runtime options
  ...(config.options && {
    transform: config.options.transform,
    prepare: config.options.prepare,
    validate: config.options.validate
  }),

  // Helper to get the TypeScript type
  getType: () => z.infer<T>,

  // Helper to parse/validate a value
  parse: (value: unknown) => config.schema.parse(value),

  // Helper to safely parse a value
  safeParse: (value: unknown) => config.schema.safeParse(value)
})

/**
 * Predefined field type factory (f object)
 */
const f = {
  text: (options?: TextOptions): FieldType =>
    fieldType({
      type: 'text',
      columnType: options?.maxLength ? `varchar(${options.maxLength})` : 'text',
      schema: options?.minLength || options?.maxLength
        ? z.string().min(options.minLength ?? 0).max(options.maxLength!)
        : z.string(),
      options: options?.pattern ? { validate: (v) => new RegExp(options.pattern!).test(v) } : undefined
    }),

  number: (options?: NumberOptions): FieldType =>
    fieldType({
      type: 'number',
      columnType: options?.precision
        ? `numeric(${options.precision}, ${options.scale ?? 0})`
        : 'decimal',
      schema: options?.min !== undefined || options?.max !== undefined
        ? z.number().min(options?.min ?? -Infinity).max(options?.max ?? Infinity)
        : z.number()
    }),

  boolean: (): FieldType =>
    fieldType({
      type: 'boolean',
      columnType: 'boolean',
      schema: z.boolean()
    }),

  date: (): FieldType =>
    fieldType({
      type: 'date',
      columnType: 'date',
      schema: z.date()
    }),

  timestamp: (): FieldType =>
    fieldType({
      type: 'timestamp',
      columnType: 'timestamp',
      schema: z.date()
    }),

  email: (): FieldType =>
    fieldType({
      type: 'email',
      columnType: 'varchar(255)',
      schema: z.string().email(),
      options: {
        transform: (value) => value?.toLowerCase().trim()
      }
    }),

  url: (): FieldType =>
    fieldType({
      type: 'url',
      columnType: 'varchar(2048)',
      schema: z.string().url()
    }),

  select: <T extends string[]>(values: T): FieldType =>
    fieldType({
      type: 'select',
      columnType: `varchar(${Math.max(...values.map(v => v.length))})`,
      schema: z.enum(values)
    }),

  json: <T extends z.ZodType>(schema?: T): FieldType =>
    fieldType({
      type: 'json',
      columnType: 'jsonb',
      schema: schema ?? z.any()
    }),

  array: <T extends z.ZodType>(itemSchema: T): FieldType =>
    fieldType({
      type: 'array',
      columnType: 'jsonb',
      schema: z.array(itemSchema)
    }),

  richtext: (): FieldType =>
    fieldType({
      type: 'richtext',
      columnType: 'text',
      schema: z.string()
    }),

  file: (options?: FileOptions): FieldType =>
    fieldType({
      type: 'file',
      columnType: options?.multiple ? 'text' : 'varchar(500)',
      schema: options?.multiple ? z.array(z.string()) : z.string().optional()
    }),

  relation: (options: RelationOptions): FieldType =>
    fieldType({
      type: 'relation',
      columnType: options.many ? 'text' : 'uuid',
      schema: options.many ? z.array(z.string()) : z.string()
    })
}
      schema: z.string()
    }),

  file: (options?: FileOptions): FieldType =>
    fieldType({
      type: 'file',
      columnType: options?.multiple ? 'text' : 'varchar(500)',
      schema: options?.multiple ? z.array(z.string()) : z.string().optional()
    }),

  relation: (options: RelationOptions): FieldType =>
    fieldType({
      type: 'relation',
      columnType: options.many ? 'text' : 'uuid',
      schema: options.many ? z.array(z.string()) : z.string()
    })
}

// Export types
export type TextOptions = {
  minLength?: number
  maxLength?: number
  pattern?: string
}

export type NumberOptions = {
  min?: number
  max?: number
  precision?: number
  scale?: number
}

export type FileOptions = {
  multiple?: boolean
}

export type RelationOptions = {
  to: string
  many?: boolean
  through?: string
  onDelete?: 'cascade' | 'nullify' | 'error'
}
```

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

// With min/max validation
const rating = field({
  fieldType: f.number({ min: 1, max: 5 })
})

// Decimal for financial data (precision, scale)
const price = field({
  fieldType: f.number({ precision: 10, scale: 2 })
})
```

Options:
- `min` / `max` - Value constraints
- `precision` - Total number of digits
- `scale` - Digits after decimal point (for decimal types)

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

// With Zod schema for type safety
const settings = field({
  fieldType: f.json(z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean()
  }))
})
```

When using a Zod schema, TypeScript infers the type automatically for type-safe access.

### Array

```typescript
const tags = field({
  fieldType: f.array(z.string())
})

const scores = field({
  fieldType: f.array(z.number())
})
```

### Rich Text

For HTML or Markdown content:

```typescript
const content = field({
  fieldType: f.richtext()
})
```

### File

For file uploads (stores file reference/path):

```typescript
const avatar = field({
  fieldType: f.file()
})

const attachments = field({
  fieldType: f.file({ multiple: true })
})
```

Options:
- `multiple` - Allow multiple files

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

**Note on `many: true`:** When `many: true` is set without a `through` table, it creates a reverse relation (e.g., "user has many posts"). For true many-to-many relations, use the `through` option to specify a junction table.

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

## Auto-Generated Fields

Every collection automatically includes these fields:

- `id` - Unique identifier (auto-generated UUID)
- `createdAt` - Timestamp when record was created
- `updatedAt` - Timestamp when record was last updated

```typescript
type Post = GetCollectionType<typeof posts>
// {
//   id: string
//   createdAt: Date
//   updatedAt: Date
//   ... your custom fields
// }
```

### Configuration

Auto-generated fields can be configured per collection:

```typescript
const posts = collection({
  slug: 'posts',

  // Configure ID
  id: {
    type: 'uuid',       // 'uuid' | 'string' | 'number'
    autoGenerate: true
  },

  // Configure timestamps
  createdAt: {
    fieldName: 'created_at',
    autoSet: true
  },

  updatedAt: {
    fieldName: 'updated_at',
    autoSet: true,
    onUpdate: true
  },

  fields: {
    title: field({ fieldType: f.text() })
  }
})
```

### Disable Fields

For immutable tables (logs), disable auto timestamps:

```typescript
const logs = collection({
  slug: 'logs',
  updatedAt: false,  // Disable auto-updatedAt

  fields: {
    action: field({ fieldType: f.text() }),
    timestamp: field({ fieldType: f.timestamp() })
  }
})
```

## Validation vs Database Constraints

Field options like `minLength`, `maxLength`, `min`, `max` serve double duty:

1. **Application-level validation** - Enforced by Zod when data is submitted
2. **Database constraints** - Applied to the column schema (e.g., VARCHAR(100))

This ensures data integrity both in your application and directly in the database.

```typescript
// This field will:
// - Validate max 100 chars in JS
// - Create VARCHAR(100) column in SQL
const title = field({
  fieldType: f.text({ maxLength: 100 })
})
```

## Summary

| Type | Description | Options |
|------|-------------|---------|
| `f.text()` | String | `minLength`, `maxLength`, `pattern` |
| `f.number()` | Integer/Decimal | `min`, `max`, `precision`, `scale` |
| `f.boolean()` | Boolean | - |
| `f.date()` | Date only | - |
| `f.timestamp()` | Date with time | - |
| `f.email()` | Email | - |
| `f.url()` | URL | - |
| `f.select(['a', 'b'])` | Enum | Array of options |
| `f.json()` | JSON | Zod schema |
| `f.array(type)` | Array | Zod schema for items |
| `f.relation({ to: '...' })` | Relation | `kind`, `through`, `onDelete` |
| `f.file()` | File | `multiple` |
| `f.richtext()` | Rich text | - |
| `fieldType({...})` | Custom | Zod schema + columnType |
