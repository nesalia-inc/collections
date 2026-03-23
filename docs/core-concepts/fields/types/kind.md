# Column Types

Low-level functions that return column type objects used by database providers.

These functions are used internally by field type implementations and plugins.

## Functions

```typescript
// Numeric types
serial()     // { name: 'serial' }
integer()    // { name: 'integer' }
numeric()    // { name: 'numeric', precision, scale }
decimal()    // { name: 'decimal', precision, scale }
real()       // { name: 'real' }

// Character types
text()       // { name: 'text' }
varchar(n)   // { name: 'varchar', length: n }
char(n)      // { name: 'char', length: n }

// Boolean
boolean()    // { name: 'boolean' }

// Date/Time types
date()       // { name: 'date' }
timestamp()  // { name: 'timestamp' }

// JSON types
json()       // { name: 'json' }
jsonb()      // { name: 'jsonb' }

// Other types
uuid()       // { name: 'uuid' }
enum_(['a', 'b']) // { name: 'enum', values: ['a', 'b'] }
```

## Return Type

```typescript
interface ColumnTypeObject {
  name: string
  length?: number
  precision?: number
  scale?: number
  values?: string[]
}
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