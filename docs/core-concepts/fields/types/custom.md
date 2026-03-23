# Custom Field Types

Use `fieldType` to create custom field types with full control.

## Usage

```typescript
import { field, fieldType, z, varchar, text } from '@deessejs/collections'

// Simple custom field
const customText = fieldType({
  type: 'text',
  columnType: varchar(255),
  schema: z.string().min(1).max(255)
})

// Advanced custom field with options
const customField = fieldType({
  type: 'custom',
  columnType: text(),
  schema: z.string(),
  options: {
    transform: (value) => value?.trim(),
    prepare: (value) => value ?? null
  }
})

// Usage
const myField = field({
  fieldType: customText
})
```

## Function Signature

```typescript
const fieldType = <T extends z.ZodType>(
  config: FieldTypeConfig<T>
) => FieldType
```

## Type Definition

```typescript
type FieldTypeConfig<T extends z.ZodType> = {
  type: string
  columnType: ColumnType
  schema: T
  options?: {
    transform?: (value: z.infer<T>) => z.infer<T>
    prepare?: (value: z.infer<T>) => z.infer<T>
    validate?: (value: z.infer<T>) => boolean
  }
}
```

The `columnType` accepts the return value of column type functions like `varchar(255)`, `text()`, `integer()`, etc.

## Implementation

```typescript
import { z } from 'zod'

const fieldType = <T extends z.ZodType>(
  config: FieldTypeConfig<T>
): FieldType => ({
  type: config.type,
  columnType: config.columnType,
  schema: config.schema,
  ...(config.options && {
    transform: config.options.transform,
    prepare: config.options.prepare,
    validate: config.options.validate
  }),
  getType: () => z.infer<T>,
  parse: (value: unknown) => config.schema.parse(value),
  safeParse: (value: unknown) => config.schema.safeParse(value)
})
```
