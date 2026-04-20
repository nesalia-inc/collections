# Payload CMS Schema Building and Push Mechanism

## 1. Overview

Payload CMS uses a sophisticated **three-layer architecture** to transform collections into database schema:

```
Collection Config (User API)
        ↓
FlattenedFields + buildRawSchema (Abstract Schema Layer)
        ↓
RawTable/RawColumn/RawRelation (Database-Agnostic Description)
        ↓
pgTable/sqliteTable + Drizzle Relations (Drizzle ORM Layer)
        ↓
pushDevSchema() → drizzle-kit → Database
```

The flow begins when Payload initializes the database adapter via `init()` in `packages/drizzle/src/postgres/init.ts`:

```typescript
export const init: Init = async function init(this: BasePostgresAdapter) {
  this.rawRelations = {}
  this.rawTables = {}

  buildRawSchema({           // Step 1: Build abstract schema
    adapter: this,
    setColumnID,
  })

  await executeSchemaHooks({ type: 'beforeSchemaInit', adapter: this })

  // Create locales enum if localization is enabled
  if (this.payload.config.localization) {
    this.enums.enum__locales = this.pgSchema.enum(
      '_locales',
      this.payload.config.localization.locales.map(({ code }) => code) as [string, ...string[]],
    )
  }

  // Step 2: Convert RawTables to Drizzle tables
  for (const tableName in this.rawTables) {
    buildDrizzleTable({ adapter: this, rawTable: this.rawTables[tableName] })
  }

  // Step 3: Build Drizzle relations
  buildDrizzleRelations({ adapter: this })

  await executeSchemaHooks({ type: 'afterSchemaInit', adapter: this })

  this.schema = {
    pgSchema: this.pgSchema,
    ...this.tables,
    ...this.relations,
    ...this.enums,
  }
}
```

---

## 2. Collection Flattening - How Collections Become flattenedFields

### The flattenAllFields Utility

Payload transforms the nested field structure into a flat array via `packages/payload/src/utilities/flattenAllFields.ts`. This happens during collection sanitization in `packages/payload/src/collections/config/sanitize.ts`:

```typescript
sanitizedConfig.flattenedFields = flattenAllFields({ fields: sanitizedConfig.fields })
```

### How Flattening Works

The `flattenAllFields` function recursively processes each field:

1. **Array/Group Fields**: Push a new object with `flattenedFields` property containing the flattened child fields
2. **Blocks Fields**: Similar to array/group, but preserves block references and flattens each block's fields
3. **Tabs Fields**: If a tab has a name, it becomes a `FlattenedTabAsField`; otherwise, its fields are inlined
4. **Collapsible/Row Fields**: Fields are inlined (not nested)
5. **Other Fields**: Pushed directly to the result array

Key caching mechanism:
```typescript
const flattenedFieldsCache = new Map<Field[], FlattenedField[]>()

export const flattenAllFields = ({ cache, fields }) => {
  if (cache) {
    const maybeFields = flattenedFieldsCache.get(fields)
    if (maybeFields) {
      return maybeFields
    }
  }
  // ... processing ...
  flattenedFieldsCache.set(fields, result)
  return result
}
```

### FlattenedField Types

```typescript
export type FlattenedField =
  | CheckboxField
  | CodeField
  | DateField
  | EmailField
  | FlattenedArrayField       // Has flattenedFields: FlattenedField[]
  | FlattenedBlocksField      // Has flattenedFields in each block
  | FlattenedGroupField       // Has flattenedFields: FlattenedField[]
  | FlattenedJoinField
  | FlattenedTabAsField       // Has flattenedFields: FlattenedField[]
  | JSONField
  | NumberField
  | PointField
  | RadioField
  | RelationshipField
  | RichTextField
  | SelectField
  | TextField
  | TextareaField
  | UploadField
```

---

## 3. RawTable/RawColumn Architecture - The Abstract Schema Layer

### RawColumn Types

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

export type RawColumn =
  | ({
      type: 'boolean' | 'geometry' | 'jsonb' | 'numeric' | 'serial' | 'text' | 'varchar'
    } & BaseRawColumn)
  | BinaryVecRawColumn      // type: 'bit'
  | EnumRawColumn           // type: 'enum' with locale: true or enumName + options
  | HalfVecRawColumn        // type: 'halfvec'
  | IntegerRawColumn        // type: 'integer' (SQLite autoincrement)
  | SparseVecRawColumn      // type: 'sparsevec'
  | TimestampRawColumn     // type: 'timestamp' with mode, precision, withTimezone
  | UUIDRawColumn           // type: 'uuid' with defaultRandom
  | VectorRawColumn         // type: 'vector'
```

### RawTable Structure

```typescript
export type RawTable = {
  columns: Record<string, RawColumn>
  foreignKeys?: Record<string, RawForeignKey>
  indexes?: Record<string, RawIndex>
  name: string
}

export type RawForeignKey = {
  columns: string[]
  foreignColumns: { name: string; table: string }[]
  name: string
  onDelete?: UpdateDeleteAction
  onUpdate?: UpdateDeleteAction
}

export type RawIndex = {
  name: string
  on: string | string[]
  unique?: boolean
}
```

---

## 4. Field Type Mapping - How Each Field Type Becomes a Column

### Field-to-Column Mapping Table

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

### Localization Logic

When a field is localized, it goes to the locales table instead of the main table:

```typescript
const isFieldLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

if (
  adapter.payload.config.localization &&
  (isFieldLocalized || forceLocalized) &&
  field.type !== 'array' &&
  (field.type !== 'blocks' || adapter.blocksAsJSON) &&
  (('hasMany' in field && field.hasMany !== true) || !('hasMany' in field))
) {
  hasLocalizedField = true
  targetTable = localesColumns   // Redirect to locales table
  targetIndexes = localesIndexes
}
```

---

## 5. Relation Handling - How Relationships Are Resolved

### Relationship Types

1. **hasMany Relationship (Polymorphic)**: Creates a `_rels` junction table
2. **belongsTo Relationship**: Direct foreign key column on the source table
3. **Array Relationship**: Creates separate table with `_order` and `_parentID`
4. **Block Relationship**: Creates block tables with `_parentID` and `_path`

### Relationship Table Structure

For a `hasMany` or polymorphic relationship (`relationTo: ['collection1', 'collection2']`):

```typescript
const relationshipColumns: Record<string, RawColumn> = {
  id: { name: 'id', type: 'serial', primaryKey: true },
  order: { name: 'order', type: 'integer' },
  parent: { name: 'parent_id', type: idColType, notNull: true },
  path: { name: 'path', type: 'varchar', notNull: true },
  locale: { name: 'locale', type: 'enum', locale: true },  // If localized
  [relationToID]: { name: `${formattedRelationTo}_id`, type: colType },
}
```

---

## 6. Drizzle Table Building - How RawTable Becomes pgTable/sqliteTable

### buildDrizzleTable Function

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
    case 'enum':
      if ('locale' in column) {
        columns[key] = adapter.enums.enum__locales(column.name)
      } else {
        adapter.enums[column.enumName] = adapter.pgSchema.enum(...)
        columns[key] = adapter.enums[column.enumName](column.name)
      }
      break
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
  }

  // Add constraints
  if (column.reference) {
    columns[key].references(() => adapter.tables[column.reference.table][column.reference.name], {
      onDelete: column.reference.onDelete,
    })
  }
  if (column.primaryKey) columns[key].primaryKey()
  if (column.notNull) columns[key].notNull()
  if (typeof column.default !== 'undefined') columns[key].default(column.default)
}
```

### Extra Config (Indexes and Foreign Keys)

```typescript
const extraConfig = (cols: any) => {
  const config: Record<string, ForeignKeyBuilder | IndexBuilder> = {}

  if (rawTable.indexes) {
    for (const [key, rawIndex] of Object.entries(rawTable.indexes)) {
      let fn: any = index
      if (rawIndex.unique) fn = uniqueIndex
    }
  }

  if (rawTable.foreignKeys) {
    for (const [key, rawForeignKey] of Object.entries(rawTable.foreignKeys)) {
      let builder = foreignKey({
        name: rawForeignKey.name,
        columns: rawForeignKey.columns.map((colName) => cols[colName]),
        foreignColumns: rawForeignKey.foreignColumns.map(
          (column) => adapter.tables[column.table][column.name],
        ),
      })
    }
  }
  return config
}

adapter.tables[rawTable.name] = adapter.pgSchema.table(
  rawTable.name,
  columns as any,
  extraConfig as any,
)
```

---

## 7. Schema Push Process - How pushDevSchema Works

### Location and Purpose

`packages/drizzle/src/utilities/pushDevSchema.ts` - Used during development to sync schema changes to the database.

### Push Logic

```typescript
export const pushDevSchema = async (adapter: DrizzleAdapter) => {
  // Skip if no changes (using dequal for deep equality check)
  if (process.env.PAYLOAD_FORCE_DRIZZLE_PUSH !== 'true') {
    const localeCodes = adapter.payload.config.localization?.localeCodes

    const equal = dequal(previousSchema, {
      localeCodes,
      rawTables: adapter.rawTables,
    })

    if (equal) {
      adapter.payload.logger.info('No changes detected in schema, skipping schema push.')
      return
    }
  }

  // Load drizzle-kit's pushSchema function
  const { pushSchema } = adapter.requireDrizzleKit()

  // Call pushSchema from drizzle-kit
  const { apply, hasDataLoss, warnings } = await pushSchema(
    adapter.schema,
    adapter.drizzle,
    adapter.schemaName ? [adapter.schemaName] : undefined,
    tablesFilter,
    extensions.postgis ? ['postgis'] : undefined,
  )

  // Handle warnings/data loss prompts
  if (warnings.length) {
    // Prompt user for confirmation
  }

  // Execute the push
  await apply()

  // Record the dev push in migrations table
  await drizzle.insert(adapter.tables.payload_migrations).values({
    name: 'dev',
    batch: -1,
  })
}
```

### requireDrizzleKit

```typescript
export const requireDrizzleKit: RequireDrizzleKit = () => {
  const {
    generateDrizzleJson,
    generateMigration,
    pushSchema,
    upPgSnapshot,
  } = require('drizzle-kit/api')

  return {
    generateDrizzleJson,
    generateMigration,
    pushSchema,
    upSnapshot: upPgSnapshot,
  }
}
```

---

## 8. Migration Execution - How Payload's Migration System Works

### Migration Collection

```typescript
export const migrationsCollection: CollectionConfig = {
  slug: 'payload-migrations',
  admin: { hidden: true },
  endpoints: false,
  fields: [
    { name: 'name', type: 'text' },
    { name: 'batch', type: 'number' },  // -1 for dev pushes
  ],
  graphQL: false,
  lockDocuments: false,
}
```

### Payload Migration Flow

```typescript
export const migrate: DrizzleAdapter['migrate'] = async function migrate(
  this: DrizzleAdapter,
  args,
): Promise<void> {
  const { payload } = this
  const migrationFiles = args?.migrations || (await readMigrationFiles({ payload }))

  let latestBatch = 0
  let migrationsInDB = []

  const hasMigrationTable = await migrationTableExists(this)

  if (hasMigrationTable) {
    ;({ docs: migrationsInDB } = await payload.find({
      collection: 'payload-migrations',
      limit: 0,
      sort: '-name',
    }))

    if (Number(migrationsInDB?.[0]?.batch) > 0) {
      latestBatch = Number(migrationsInDB[0]?.batch)
    }
  }

  const newBatch = latestBatch + 1

  // Execute 'up' for each migration sequentially
  for (const migration of migrationFiles) {
    const alreadyRan = migrationsInDB.find((existing) => existing.name === migration.name)
    if (alreadyRan) continue

    await runMigrationFile(payload, migration, newBatch)
  }
}

async function runMigrationFile(payload: Payload, migration: Migration, batch: number) {
  const req = await createLocalReq({}, payload)

  payload.logger.info({ msg: `Migrating: ${migration.name}` })

  try {
    await initTransaction(req)
    const db = await getTransaction(payload.db as DrizzleAdapter, req)
    await migration.up({ db, payload, req })

    await payload.create({
      collection: 'payload-migrations',
      data: { name: migration.name, batch },
      req,
    })
    await commitTransaction(req)
  } catch (err: unknown) {
    await killTransaction(req)
    payload.logger.error({ err, msg: `Error running migration ${migration.name}` })
    process.exit(1)
  }
}
```

---

## 9. Key Insights - What @deessejs/collections Can Learn from This

### Architecture Patterns

1. **Three-Layer Schema Abstraction**: Payload's approach of:
   - Layer 1: Abstract schema description (RawTable/RawColumn)
   - Layer 2: ORM-specific schema (pgTable/sqliteTable)
   - Layer 3: Database push (drizzle-kit)

   This separation allows for database-agnostic schema building.

2. **FlattenedFields as the Core Contract**: The flattened field array is the central contract between collection configuration sanitization, schema building, query validation, and operation execution.

3. **Caching for Performance**: The `flattenedFieldsCache` in `flattenAllFields` prevents redundant processing.

### Field Handling Patterns

4. **Polymorphic Relationships via Junction Tables**: hasMany/polymorphic relationships create junction tables (`_rels`) rather than multiple columns.

5. **hasMany Numbers/Text Create Separate Tables**: Dedicated tables (`_numbers`, `_texts`) are created for indexing capability.

6. **Localized Fields Redirect to Locales Table**: Fields that need localization are added to the locale suffix table rather than the main table.

7. **Block/Array Tables Include Order and Parent Tracking**: Tables for nested structures include `_order`, `_parentID`, and (for blocks) `_path` columns.

### Dev/Prod Pattern

8. **Dev Schema Push vs. Production Migrations**:
   - Dev: Uses `pushDevSchema()` with `drizzle-kit` for instant sync
   - Prod: Uses migration files with batch tracking

9. **Batch -1 for Dev Pushes**: Dev schema pushes are tracked with batch -1 to distinguish from real migrations.

10. **Change Detection**: The `dequal` library checks if schema has actually changed before pushing.

### Potential Improvements for @deessejs/collections

- Consider adopting RawTable/RawColumn abstraction for database-agnostic schema building
- Use flattenedFields as the core contract between configuration and schema
- Implement similar table-building recursion for arrays and blocks
- Consider the junction table pattern for hasMany relationships
- Add dev schema push mechanism separate from migration running
- Implement before/after schema hooks for extensibility
