# Column Types

Low-level functions that map directly to database column types.

These functions are used internally by field type implementations and plugins.

## Functions

```typescript
// Primitive types
integer()     // 'integer'
decimal()    // 'decimal'
text()        // 'text'
boolean()     // 'boolean'

// Date types
date()        // 'date'
timestamp()   // 'timestamp'

// String types with length
email()       // 'email' (semantic type)
url()         // 'url' (semantic type)
varchar(255)  // 'varchar(255)'

// JSON types
json()        // 'jsonb'

// UUID
uuid()        // 'uuid'
```

## Usage

These functions are used in field type implementations:

```typescript
import { fieldType, text, boolean, json, varchar, integer } from '@deessejs/collections'

const myField = fieldType({
  type: 'myField',
  columnType: varchar(255),
  schema: z.string()
})
```

The database provider uses the return value to generate SQL.

## Type Definition

```typescript
export type ColumnType =
  | 'integer'
  | 'decimal'
  | 'text'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'email'
  | 'url'
  | 'varchar'
  | 'jsonb'
  | 'uuid'
  | 'file'
  | 'relation'
```

## Reference

| Function | Column Type | Description |
|----------|-------------|-------------|
| `integer()` | `'integer'` | Integer number |
| `decimal()` | `'decimal'` | Decimal number |
| `text()` | `'text'` | Text string |
| `boolean()` | `'boolean'` | True/false |
| `date()` | `'date'` | Date only |
| `timestamp()` | `'timestamp'` | Date with time |
| `email()` | `'email'` | Email string |
| `url()` | `'url'` | URL string |
| `varchar(n)` | `'varchar(n)'` | Variable-length string |
| `json()` | `'jsonb'` | JSON object |
| `uuid()` | `'uuid'` | UUID |
