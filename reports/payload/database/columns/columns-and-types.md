# Payload CMS Database Column Types Analysis

## Overview

This report documents how Payload CMS handles database column types across different database adapters, with a focus on PostgreSQL. The analysis is based on the three-layer architecture that Payload uses to transform collection configurations into database schemas.

## Architecture

Payload uses a three-layer architecture for schema building:

```
Collection Config (User API)
        ↓
FlattenedFields + buildRawSchema (Abstract Schema Layer)
        ↓
RawTable/RawColumn/RawRelation (Database-Agnostic Description)
        ↓
pgTable/sqliteTable + Drizzle Relations (Drizzle ORM Layer)
        ↓
Database (PostgreSQL, SQLite, MongoDB, etc.)
```

## Layer 1: RawColumn Types

### RawColumn Type Union

Located in `packages/drizzle/src/types.ts`:

```typescript
export type RawColumn =
  | ({
      type: 'boolean' | 'geometry' | 'jsonb' | 'numeric' | 'serial' | 'text' | 'varchar'
    } & BaseRawColumn)
  | BinaryVecRawColumn      // type: 'bit'
  | EnumRawColumn           // type: 'enum' with locale: true or enumName + options
  | HalfVecRawColumn        // type: 'halfvec'
  | IntegerRawColumn       // type: 'integer' (SQLite autoincrement)
  | SparseVecRawColumn      // type: 'sparsevec'
  | TimestampRawColumn     // type: 'timestamp' with mode, precision, withTimezone
  | UUIDRawColumn           // type: 'uuid' with defaultRandom
  | VectorRawColumn         // type: 'vector'
```

### BaseRawColumn Structure

```typescript
export type BaseRawColumn = {
  default?: any
  name: string
  notNull?: boolean
  primaryKey?: boolean
  reference?: {
    name: string
    onDelete: UpdateDeleteAction
    table: string
  }
}
```

## Layer 2: Field-to-Column Mapping

### PostgreSQL Column Type Mapping

| Payload Field Type | RawColumn Type | Notes |
|-------------------|----------------|-------|
| `checkbox` | `boolean` | |
| `code`, `email`, `textarea` | `varchar` | |
| `date` | `timestamp` | mode: 'string', precision: 3, withTimezone: true |
| `json`, `richText` | `jsonb` | |
| `number` (non-hasMany) | `numeric` | |
| `number` (hasMany) | Creates `_numbers` table | Creates numbersTable |
| `point` | `geometry` | |
| `radio`, `select` (non-hasMany) | `enum` | Creates enum per select |
| `select` (hasMany) | Creates `<table>_select` table | Junction table with order, parent, value |
| `relationship` / `upload` (hasMany) | Creates `_rels` table | Junction table |
| `relationship` / `upload` (belongsTo) | `integer`/`uuid`/`varchar` + FK | Direct column with reference |
| `text` (non-hasMany) | `varchar` | |
| `text` (hasMany) | Creates `_texts` table | Creates textsTable |
| `array` | Creates new table | `_order`, `_parentID` columns |
| `blocks` | Creates new table(s) | `_order`, `_parentID`, `_path` columns |
| `group` / `tab` | Recursive flatten | Columns prefixed with group name |

### ID Column Configuration

The ID column type is configurable at the adapter level:

```typescript
// packages/db-postgres/src/index.ts:70
const postgresIDType = args.idType || 'serial'
const payloadIDType = postgresIDType === 'serial' ? 'number' : 'text'
```

Supported ID types for PostgreSQL:
- `'serial'` → `number` (default)
- `'uuid'` → `text`

## Layer 3: Drizzle Table Building

### PostgreSQL buildDrizzleTable

Located in `packages/drizzle/src/postgres/schema/buildDrizzleTable.ts`:

```typescript
const rawColumnBuilderMap: Partial<Record<RawColumn['type'], any>> = {
  boolean,
  geometry: geometryColumn,
  integer,
  jsonb,
  numeric,
  serial,
  text,
  uuid,
  varchar,
}
```

### Column Building Process

```typescript
for (const [key, column] of Object.entries(rawTable.columns)) {
  switch (column.type) {
    case 'bit': {
      columns[key] = bit(column.name, { dimensions: column.dimensions })
      break
    }
    case 'enum': {
      // Handle locale enum or regular enum
      if ('locale' in column) {
        columns[key] = adapter.enums.enum__locales(column.name)
      } else {
        adapter.enums[column.enumName] = adapter.pgSchema.enum(...)
        columns[key] = adapter.enums[column.enumName](column.name)
      }
      break
    }
    case 'timestamp': {
      let builder = timestamp(column.name, {
        mode: column.mode,
        precision: column.precision,
        withTimezone: column.withTimezone,
      })
      if (column.defaultNow) {
        builder = builder.defaultNow()
      }
      columns[key] = builder
      break
    }
    case 'uuid': {
      let builder = uuid(column.name)
      if (column.defaultRandom) {
        builder = builder.defaultRandom()
      }
      columns[key] = builder
      break
    }
    // ... other types use default:
    default:
      columns[key] = rawColumnBuilderMap[column.type](column.name)
      break
  }

  // Add constraints
  if (column.reference) {
    columns[key].references(...)
  }
  if (column.primaryKey) columns[key].primaryKey()
  if (column.notNull) columns[key].notNull()
  if (typeof column.default !== 'undefined') {
    columns[key].default(column.default)
  }
}
```

### Constraint Application Order

Constraints are applied AFTER the column is created:

1. `references()` - Foreign key constraint
2. `primaryKey()` - Primary key constraint
3. `notNull()` - NOT NULL constraint
4. `default()` - Default value

This order is important because some constraints may modify the column builder's return type.

## Special Column Types

### Serial/Integer (Auto-increment)

For SQLite, the `serial` type maps to `integer`:

```typescript
// packages/drizzle/src/sqlite/schema/buildDrizzleTable.ts:52
case 'serial': {
  columns[key] = integer(column.name)
  break
}
```

For PostgreSQL, `serial` uses the native `serial()` type from drizzle-orm/pg-core.

### UUID

UUID columns support `defaultRandom`:

```typescript
case 'uuid': {
  let builder = uuid(column.name)
  if (column.defaultRandom) {
    builder = builder.defaultRandom()
  }
  columns[key] = builder
  break
}
```

### Timestamp

Timestamp columns support multiple options:

```typescript
case 'timestamp': {
  let builder = timestamp(column.name, {
    mode: column.mode,           // 'string' | 'date'
    precision: column.precision,   // 0-6
    withTimezone: column.withTimezone,
  })
  if (column.defaultNow) {
    builder = builder.defaultNow()
  }
  columns[key] = builder
  break
}
```

### Enums

Payload handles enums differently for locales vs regular enums:

```typescript
case 'enum':
  if ('locale' in column) {
    // Use the special locales enum
    columns[key] = adapter.enums.enum__locales(column.name)
  } else {
    // Create a new enum for this field
    adapter.enums[column.enumName] = adapter.pgSchema.enum(
      column.enumName,
      column.options as [string, ...string[]],
    )
    columns[key] = adapter.enums[column.enumName](column.name)
  }
  break
```

## Extra Configuration

### Indexes

```typescript
const extraConfig = (cols: any) => {
  const config: Record<string, IndexBuilder> = {}

  if (rawTable.indexes) {
    for (const [key, rawIndex] of Object.entries(rawTable.indexes)) {
      let fn: any = index
      if (rawIndex.unique) {
        fn = uniqueIndex
      }
      // ...
    }
  }

  return config
}
```

### Foreign Keys

```typescript
if (rawTable.foreignKeys) {
  for (const [key, rawForeignKey] of Object.entries(rawTable.foreignKeys)) {
    let builder = foreignKey({
      name: rawForeignKey.name,
      columns: rawForeignKey.columns.map((colName) => cols[colName]),
      foreignColumns: rawForeignKey.foreignColumns.map(
        (column) => adapter.tables[column.table][column.name],
      ),
    })
    // ...
  }
}
```

## Key Differences from @deessejs/collections

### Architecture

| Aspect | Payload CMS | @deessejs/collections |
|--------|-------------|------------------------|
| Schema layers | 3 layers (Config → Raw → Drizzle) | 2 layers (Collection → Raw → Drizzle) |
| Field flattening | `flattenAllFields()` utility | Inline processing |
| Column types | Full RawColumn union | Simplified set |

### Serial/UUID Handling

Payload defaults to `serial` for IDs:
```typescript
const postgresIDType = args.idType || 'serial'
```

@deessejs/collections uses `uuid` by default for auto-generated IDs.

### Constraints Application

Both systems apply constraints after column creation, but Payload uses a more structured `extraConfig` function pattern.

## Recommendations for @deessejs/collections

1. **Consider supporting `serial` as ID type** - Cloud PostgreSQL providers like Neon may handle serial differently
2. **Follow Payload's constraint order** - references → primaryKey → notNull → default
3. **Use `apply()` for schema push** - Rather than manually executing statements, let drizzle-kit handle it
4. **Handle enum creation properly** - Ensure enums are created before tables that use them

## References

- `packages/drizzle/src/types.ts` - RawColumn/RawTable definitions
- `packages/drizzle/src/postgres/schema/buildDrizzleTable.ts` - PostgreSQL column building
- `packages/drizzle/src/sqlite/schema/buildDrizzleTable.ts` - SQLite column building
- `packages/drizzle/src/utilities/pushDevSchema.ts` - Schema push mechanism
- `packages/db-postgres/src/index.ts` - PostgreSQL adapter configuration
