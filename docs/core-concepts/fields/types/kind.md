# Column Types

Low-level functions that map directly to database column types.

## Functions

```typescript
// Primitive types
integer()     // 'integer'
text()        // 'text'
boolean()     // 'boolean'

// Date types
date()        // 'date'
timestamp()   // 'timestamp'

// String types
email()       // 'varchar(255)'
url()         // 'varchar(2048)'

// JSON types
json()        // 'jsonb'

// Enum type
enum(['a', 'b', 'c']) // 'varchar' with CHECK constraint

// Special types
file()        // 'varchar(500)'
relation()    // 'uuid'
```

## Usage

```typescript
import { field, integer, text, boolean, json, enum_ } from '@deessejs/collections'

// Primitive fields
const age = field({ type: integer() })
const name = field({ type: text() })
const active = field({ type: boolean() })

// JSON field
const metadata = field({ type: json() })

// Enum field
const status = field({
  type: enum_(['draft', 'published', 'archived'])
})
```

## Type Definition

The return type of these functions is `ColumnType`:

```typescript
export type ColumnType =
  | 'integer'
  | 'text'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'email'
  | 'url'
  | 'jsonb'
  | 'varchar'
  | 'file'
  | 'relation'
```

## Reference

| Function | Column Type | Description |
|----------|-------------|-------------|
| `integer()` | `'integer'` | Integer number |
| `text()` | `'text'` | Text string |
| `boolean()` | `'boolean'` | True/false |
| `date()` | `'date'` | Date only |
| `timestamp()` | `'timestamp'` | Date with time |
| `email()` | `'email'` | Email string (validated) |
| `url()` | `'url'` | URL string (validated) |
| `json()` | `'jsonb'` | JSON object |
| `enum_(['a', 'b'])` | `'varchar'` | Enum with constraint |
| `file()` | `'file'` | File reference |
| `relation()` | `'relation'` | Relation to another collection |
