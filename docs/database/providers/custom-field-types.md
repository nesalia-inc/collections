# Creating Custom Field Types

Fields in Collections are **agnostic by design**. A field simply declares its type using DSL primitives—it has no knowledge of providers or Drizzle. The translation to database-specific columns happens entirely within the provider.

## Field Type Definition

When creating a custom field type, you only specify the DSL-level type:

```typescript
// fields/custom.ts
import { fieldType } from '@deessejs/collections'
import { z } from 'zod'

// Just define the field using DSL primitives
// The provider handles the translation to pgText / mysqlText / text
export const slug = fieldType({
  // Pure DSL type - no Drizzle knowledge
  kind: 'text',

  schema: z.string()
    .regex(/^[a-z0-9-]+$/, 'Must contain only lowercase letters, numbers, and hyphens')
    .min(3)
    .max(100)
})

// Usage - the field just declares its type
const posts = defineCollection({
  slug: 'posts',
  fields: {
    slug: slug()
  }
})
```

## How Provider Translation Works

Field types provide a `columnType` property. Providers read this and translate to database-specific columns:

```typescript
// Field type provides columnType (no provider knowledge)
const textField = field({
  fieldType: f.text()
})
// textField.columnType = 'text'

// Provider reads columnType and maps to database
const pgAdapter = databaseProvider({
  name: 'pg',

  // Provider reads columnType from field definition
  createTable: (name, columns) => {
    const colDefs = columns.map(col => {
      const type = this.types[col.columnType] // 'text' → 'text'
      return `${col.name} ${type}`
    })
    return `CREATE TABLE ${name} (${colDefs.join(', ')})`
  },

  types: {
    text: 'text',
    uuid: 'uuid',
    json: 'jsonb',
    timestamp: 'timestamptz'
  }
})
```

This separation ensures:
- **Fields are pure DSL** - no provider logic in field definitions
- **Providers handle translation** - each provider maps columnType to database types
- **Easy to add new providers** - just implement the mapping

## Escape Hatch: Custom Provider Types

For advanced use cases requiring provider-specific features, use custom field types:

```typescript
import { fieldType } from '@deessejs/collections'

// Custom type with provider-specific options
const citext = fieldType({
  kind: 'text',
  schema: z.string().email(),
  // Provider-specific: use native PG citext extension
  pg: { type: 'citext' },
  mysql: { type: 'longtext' }
})

// Usage
const posts = collection({
  slug: 'posts',
  fields: {
    email: field({ fieldType: citext() })
  }
})
```

The `pg`, `mysql` options allow passing provider-specific configurations while keeping the DSL portable.
