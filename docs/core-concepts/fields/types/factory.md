# Field Type Factory

The `f` object provides predefined field types for common use cases.

## Usage

```typescript
import { field, f } from '@deessejs/collections'

const name = field({
  fieldType: f.text()
})
```

## Factory Implementation

```typescript
import { text, boolean, date, timestamp, email, url, json, varchar, integer, decimal } from '@deessejs/collections'

const f = {
  text: fieldType({
    type: 'text',
    columnType: text(),
    schema: z.string()
  }),

  number: fieldType({
    type: 'number',
    columnType: decimal(),
    schema: z.number()
  }),

  boolean: fieldType({
    type: 'boolean',
    columnType: boolean(),
    schema: z.boolean()
  }),

  date: fieldType({
    type: 'date',
    columnType: date(),
    schema: z.date()
  }),

  timestamp: fieldType({
    type: 'timestamp',
    columnType: timestamp(),
    schema: z.date()
  }),

  email: fieldType({
    type: 'email',
    columnType: email(),
    schema: z.string().email(),
    transform: (value) => value?.toLowerCase().trim()
  }),

  url: fieldType({
    type: 'url',
    columnType: url(),
    schema: z.string().url()
  }),

  json: fieldType({
    type: 'json',
    columnType: json(),
    schema: z.any()
  }),

  richtext: fieldType({
    type: 'richtext',
    columnType: text(),
    schema: z.string()
  }),

  file: fieldType({
    type: 'file',
    columnType: varchar(500),
    schema: z.string().optional()
  }),

  relation: fieldType({
    type: 'relation',
    columnType: uuid(),
    schema: z.string()
  })
}
```

## Type Definitions

```typescript
export type TextOptions = {
  minLength?: number
  maxLength?: number
  pattern?: string
}

export type NumberOptions = {
  min?: number
  max?: number
  precision?: number
  scale?: number
}

export type FileOptions = {
  multiple?: boolean
}

export type RelationOptions = {
  to: string
  many?: boolean
  through?: string
  onDelete?: 'cascade' | 'nullify' | 'error'
}
```
