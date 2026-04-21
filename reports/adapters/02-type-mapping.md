# Type Mapping Reference

This document covers two mapping layers:
1. **FieldType → ColumnType** (how `f.text()` produces `{ name: 'varchar' }`)
2. **ColumnType → Drizzle** (how `{ name: 'varchar' }` becomes `varchar()`)

---

## Layer 1: FieldType to ColumnType

The `f.*` field builders produce different column types:

| FieldType | Produces ColumnType | Notes |
|-----------|---------------------|-------|
| `f.text()` | `{ name: 'varchar', length: 255 }` | Default 255, configurable via maxLength |
| `f.email()` | `{ name: 'varchar', length: 255 }` | |
| `f.url()` | `{ name: 'varchar', length: 500 }` | |
| `f.file()` | `{ name: 'varchar', length: 500 }` | |
| `f.number()` | `{ name: 'integer' }` | |
| `f.decimal(precision, scale)` | `{ name: 'decimal', precision, scale }` | |
| `f.boolean()` | `{ name: 'boolean' }` | |
| `f.date()` | `{ name: 'date' }` | |
| `f.timestamp()` | `{ name: 'timestamp' }` | |
| `f.timestampTz()` | `{ name: 'timestamptz' }` | |
| `f.json()` | `{ name: 'json' }` | |
| `f.jsonb()` | `{ name: 'jsonb' }` | |
| `f.uuid()` | `{ name: 'uuid' }` | |
| `f.select(['a', 'b'])` | `{ name: 'enum', values: ['a', 'b'] }` | |
| `f.relation()` | `{ name: 'uuid' }` | |
| `f.array(item)` | `{ name: 'array' }` | Stored as JSON |
| `f.richtext()` | `{ name: 'text' }` | |

---

## Layer 2: ColumnType to Drizzle

### PostgreSQL

| ColumnType | Drizzle | Notes |
|------------|---------|-------|
| `{ name: 'serial' }` | `serial(name)` | PostgreSQL only |
| `{ name: 'integer' }` | `integer(name)` | |
| `{ name: 'numeric'; precision; scale }` | `numeric(name, { precision, scale })` | |
| `{ name: 'decimal'; precision; scale }` | `numeric(name, { precision, scale })` | |
| `{ name: 'real' }` | `real(name)` | Native Drizzle function |
| `{ name: 'text' }` | `text(name)` | |
| `{ name: 'varchar'; length }` | `varchar(name, { length })` | |
| `{ name: 'char'; length }` | `varchar(name, { length })` | PostgreSQL uses varchar |
| `{ name: 'boolean' }` | `boolean(name)` | |
| `{ name: 'date' }` | `date(name)` | Native Drizzle function |
| `{ name: 'timestamp'; precision? }` | `timestamp(name, { precision })` | |
| `{ name: 'timestamptz' }` | `timestamp(name, { withTimezone: true })` | |
| `{ name: 'json' }` | `jsonb(name)` | |
| `{ name: 'jsonb' }` | `jsonb(name)` | |
| `{ name: 'uuid' }` | `uuid(name).defaultRandom()` | |
| `{ name: 'enum'; values }` | `pgSchema.enum(name, values)` | |
| `{ name: 'array' }` | `jsonb(name)` | Arrays stored as JSONB |

### SQLite

| ColumnType | Drizzle | Notes |
|-----------|---------|-------|
| `{ name: 'boolean' }` | `integer(name, { mode: 'boolean' })` | |
| `{ name: 'integer' }` | `integer(name)` | |
| `{ name: 'real' }` | `real(name)` | |
| `{ name: 'text' }` | `text(name)` | |
| `{ name: 'varchar' }` | `text(name)` | SQLite has no varchar |
| `{ name: 'char' }` | `text(name)` | SQLite has no char |
| `{ name: 'date' }` | `text(name)` | ISO 8601 format |
| `{ name: 'timestamp' }` | `integer(name, { mode: 'timestamp' })` | Unix epoch ms |
| `{ name: 'timestamptz' }` | `integer(name, { mode: 'timestamp_ms' })` | Unix epoch ms with TZ |
| `{ name: 'json' }` | `text(name, { mode: 'json' })` | |
| `{ name: 'jsonb' }` | `text(name, { mode: 'json' })` | |
| `{ name: 'uuid' }` | `text(name).$defaultFn(() => uuidv4())` | |
| `{ name: 'enum'; values }` | `text(name, { enum: values })` | |
| `{ name: 'array' }` | `text(name, { mode: 'json' })` | Arrays stored as JSON |

---

## Key Notes

1. **SQLite booleans**: Stored as 0/1 via `integer({ mode: 'boolean' })`
2. **SQLite timestamps**: Use `integer` with `timestamp` mode - Drizzle handles Date conversion
3. **SQLite UUIDs**: Use `text` with `$defaultFn(() => uuidv4())` for auto-generation
4. **PostgreSQL `date`**: Use native `date()` function, not `timestamp` with mode
5. **PostgreSQL `real`**: Use native `real()` function, not `customType`
6. **Arrays**: Both dialects store arrays as JSON (jsonb in PostgreSQL, text with mode: 'json' in SQLite)

---

## Complete FieldType to Drizzle Mapping

Combining both layers:

| FieldType | PostgreSQL | SQLite |
|-----------|------------|--------|
| `f.text()` | `varchar(name, { length })` | `text(name)` |
| `f.email()` | `varchar(name, { length: 255 })` | `text(name)` |
| `f.url()` | `varchar(name, { length: 500 })` | `text(name)` |
| `f.number()` | `integer(name)` | `integer(name)` |
| `f.decimal(p,s)` | `numeric(name, { precision: p, scale: s })` | `numeric(name, { mode: 'number' })` |
| `f.boolean()` | `boolean(name)` | `integer(name, { mode: 'boolean' })` |
| `f.date()` | `date(name)` | `text(name)` |
| `f.timestamp()` | `timestamp(name)` | `integer(name, { mode: 'timestamp' })` |
| `f.timestampTz()` | `timestamp(name, { withTimezone: true })` | `integer(name, { mode: 'timestamp_ms' })` |
| `f.json()` | `jsonb(name)` | `text(name, { mode: 'json' })` |
| `f.jsonb()` | `jsonb(name)` | `text(name, { mode: 'json' })` |
| `f.uuid()` | `uuid(name).defaultRandom()` | `text(name).$defaultFn(() => uuidv4())` |
| `f.select(vals)` | `pgSchema.enum(name, vals)` | `text(name, { enum: vals })` |
| `f.relation()` | `uuid(name).defaultRandom()` | `text(name).$defaultFn(() => uuidv4())` |
| `f.array(item)` | `jsonb(name)` | `text(name, { mode: 'json' })` |
| `f.richtext()` | `text(name)` | `text(name)` |
| `f.file()` | `varchar(name, { length: 500 })` | `text(name)` |
