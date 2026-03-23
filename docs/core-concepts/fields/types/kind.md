# Column Types

Low-level functions that return column type objects used by database providers.

These functions are used internally by field type implementations and plugins.

## Functions

```typescript
// Numeric types
serial()     // { name: 'serial' }
integer()    // { name: 'integer' }
numeric(p, s) // { name: 'numeric'; precision: number; scale: number }
decimal(p, s) // { name: 'decimal'; precision: number; scale: number }
real()       // { name: 'real' }

// Character types
text()       // { name: 'text' }
varchar(n)   // { name: 'varchar'; length: number }
char(n)      // { name: 'char'; length: number }

// Boolean
boolean()    // { name: 'boolean' }

// Date/Time types
date()       // { name: 'date' }
timestamp()  // { name: 'timestamp' }

// JSON types
json()       // { name: 'json' }
jsonb()       // { name: 'jsonb' }

// Other types
uuid()       // { name: 'uuid' }
enum_(values) // { name: 'enum'; values: string[] }
```

## Return Type

```typescript
type ColumnType =
  | { name: 'serial' }
  | { name: 'integer' }
  | { name: 'numeric'; precision: number; scale: number }
  | { name: 'decimal'; precision: number; scale: number }
  | { name: 'real' }
  | { name: 'text' }
  | { name: 'varchar'; length: number }
  | { name: 'char'; length: number }
  | { name: 'boolean' }
  | { name: 'date' }
  | { name: 'timestamp' }
  | { name: 'json' }
  | { name: 'jsonb' }
  | { name: 'uuid' }
  | { name: 'enum'; values: string[] }
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

The database provider uses the column type object to generate SQL.