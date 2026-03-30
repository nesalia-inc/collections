# Fields Module

High-level field type abstractions built on top of `column-types`.

## Public API

This module exposes the public API for defining field types:

```typescript
import { field, fieldType, f, type FieldType, type Field, type FieldOptions } from '@deessejs/collections'
```

### Core Exports

| Export | Description |
|--------|-------------|
| `fieldType` | Factory function for creating custom field types |
| `field` | Factory function for creating configured fields |
| `f` | Object with predefined field types ready to use |
| `FieldType<T>` | Interface for a configured field type |
| `Field<T>` | Interface for a field ready to use in a collection |
| `FieldOptions<T>` | Options for creating a field |
| `safeTransformArray` | Utility for safely transforming array values |

## Architecture

Fields sits **above** `column-types` in the abstraction hierarchy:

```
column-types/ (low-level, internal)
    └── fieldType (buildColumnType) ──► field (high-level, public API)
```

- `column-types/` provides validated SQL column type representations
- `fieldType` consumes column-types via `buildColumnType` and adds Zod validation, transforms, and options
- `field` wraps a `FieldType` with collection-level concerns (required, default, unique, indexed)

## Usage

### Predefined Field Types (`f`)

```typescript
import { field, f } from '@deessejs/collections'

const nameField = field({ fieldType: f.text() })
const emailField = field({ fieldType: f.email() })
const ageField = field({ fieldType: f.number() })
const tagsField = field({ fieldType: f.select(['draft', 'published', 'archived']) })
```

Available types: `text`, `email`, `url`, `number`, `decimal`, `boolean`, `date`, `timestamp`, `timestampTz`, `json`, `jsonb`, `uuid`, `select`, `relation`, `array`, `richtext`, `file`

### Custom Field Types (`fieldType`)

```typescript
import { field, fieldType, z, varchar } from '@deessejs/collections'

const phoneNumber = fieldType({
  type: 'phoneNumber',
  schema: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  buildColumnType: () => varchar(20)
})

const myField = field({ fieldType: phoneNumber })
```

### Field Options

```typescript
const optionalField = field({
  fieldType: f.text(),
  required: false,
  defaultValue: 'Untitled',
  unique: true,
  indexed: true
})
```

## Internal Files

These files are internal and not exported publicly:

- `builders.ts` — Implementation of predefined field types
- `columnTypeHelpers.ts` — Internal helpers for building column types
- `fieldType.ts` — `fieldType` factory implementation
- `transform.ts` — Transform utilities
- `types.ts` — Public type definitions
