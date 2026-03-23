# Column Types

Low-level functions that map directly to database column types.

These functions are used internally by field type implementations and plugins.

## Functions

```typescript
// Numeric types
serial()     // 'serial'
integer()    // 'integer'
numeric()    // 'numeric'
decimal()    // 'decimal'
real()       // 'real'

// Character types
text()       // 'text'
varchar(n)   // 'varchar(n)'
char(n)      // 'char(n)'

// Boolean
boolean()    // 'boolean'

// Date/Time types
date()       // 'date'
timestamp()  // 'timestamp'
tile()       // 'tile'

// JSON types
json()       // 'json'
jsonb()      // 'jsonb'

// Other types
uuid()       // 'uuid'
enum_(['a', 'b']) // enum
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
  | 'serial'
  | 'integer'
  | 'numeric'
  | 'decimal'
  | 'real'
  | 'text'
  | 'varchar'
  | 'char'
  | 'boolean'
  | 'date'
  | 'timestamp'
  | 'tile'
  | 'json'
  | 'jsonb'
  | 'uuid'
  | 'enum'
```

## Reference

| Function | Column Type | Description |
|----------|-------------|-------------|
| `serial()` | `'serial'` | Auto-incrementing integer |
| `integer()` | `'integer'` | Integer number |
| `numeric(p, s)` | `'numeric'` | Exact numeric with precision |
| `decimal(p, s)` | `'decimal'` | Decimal number |
| `real()` | `'real'` | Single precision float |
| `text()` | `'text'` | Text string |
| `varchar(n)` | `'varchar(n)'` | Variable-length string |
| `char(n)` | `'char(n)'` | Fixed-length string |
| `boolean()` | `'boolean'` | True/false |
| `date()` | `'date'` | Date only |
| `timestamp()` | `'timestamp'` | Date with time |
| `tile()` | `'tile'` | PostGIS tile |
| `json()` | `'json'` | JSON string |
| `jsonb()` | `'jsonb'` | Binary JSON |
| `uuid()` | `'uuid'` | UUID |
| `enum_(['a', 'b'])` | `'enum'` | Enum type |
