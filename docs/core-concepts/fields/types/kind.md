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

## Implementation

### Numeric Types

```typescript
const serial = () => ({ name: 'serial' as const })
const integer = () => ({ name: 'integer' as const })
const numeric = (precision: number, scale: number) => ({ name: 'numeric' as const, precision, scale })
const decimal = (precision: number, scale: number) => ({ name: 'decimal' as const, precision, scale })
const real = () => ({ name: 'real' as const })
```

### Character Types

```typescript
const text = () => ({ name: 'text' as const })
const varchar = (length: number) => ({ name: 'varchar' as const, length })
const char = (length: number) => ({ name: 'char' as const, length })
```

### Boolean

```typescript
const boolean = () => ({ name: 'boolean' as const })
```

### Date/Time Types

```typescript
const date = () => ({ name: 'date' as const })
const timestamp = () => ({ name: 'timestamp' as const })
```

### JSON Types

```typescript
const json = () => ({ name: 'json' as const })
const jsonb = () => ({ name: 'jsonb' as const })
```

### Other Types

```typescript
const uuid = () => ({ name: 'uuid' as const })
const enum_ = (values: string[]) => ({ name: 'enum' as const, values })
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