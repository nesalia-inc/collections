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
import { z } from 'zod'

const f = {
  text: (options?: TextOptions): FieldType =>
    fieldType({
      type: 'text',
      columnType: options?.maxLength ? `varchar(${options.maxLength})` : 'text',
      schema: options?.minLength || options?.maxLength
        ? z.string().min(options.minLength ?? 0).max(options.maxLength!)
        : z.string(),
      options: options?.pattern ? { validate: (v) => new RegExp(options.pattern!).test(v) } : undefined
    }),

  number: (options?: NumberOptions): FieldType =>
    fieldType({
      type: 'number',
      columnType: options?.precision
        ? `numeric(${options.precision}, ${options.scale ?? 0})`
        : 'decimal',
      schema: options?.min !== undefined || options?.max !== undefined
        ? z.number().min(options?.min ?? -Infinity).max(options?.max ?? Infinity)
        : z.number()
    }),

  boolean: (): FieldType =>
    fieldType({
      type: 'boolean',
      columnType: 'boolean',
      schema: z.boolean()
    }),

  date: (): FieldType =>
    fieldType({
      type: 'date',
      columnType: 'date',
      schema: z.date()
    }),

  timestamp: (): FieldType =>
    fieldType({
      type: 'timestamp',
      columnType: 'timestamp',
      schema: z.date()
    }),

  email: (): FieldType =>
    fieldType({
      type: 'email',
      columnType: 'varchar(255)',
      schema: z.string().email(),
      options: {
        transform: (value) => value?.toLowerCase().trim()
      }
    }),

  url: (): FieldType =>
    fieldType({
      type: 'url',
      columnType: 'varchar(2048)',
      schema: z.string().url()
    }),

  select: <T extends string[]>(values: T): FieldType =>
    fieldType({
      type: 'select',
      columnType: `varchar(${Math.max(...values.map(v => v.length))})`,
      schema: z.enum(values)
    }),

  json: <T extends z.ZodType>(schema?: T): FieldType =>
    fieldType({
      type: 'json',
      columnType: 'jsonb',
      schema: schema ?? z.any()
    }),

  array: <T extends z.ZodType>(itemSchema: T): FieldType =>
    fieldType({
      type: 'array',
      columnType: 'jsonb',
      schema: z.array(itemSchema)
    }),

  richtext: (): FieldType =>
    fieldType({
      type: 'richtext',
      columnType: 'text',
      schema: z.string()
    }),

  file: (options?: FileOptions): FieldType =>
    fieldType({
      type: 'file',
      columnType: options?.multiple ? 'text' : 'varchar(500)',
      schema: options?.multiple ? z.array(z.string()) : z.string().optional()
    }),

  relation: (options: RelationOptions): FieldType =>
    fieldType({
      type: 'relation',
      columnType: options.many ? 'text' : 'uuid',
      schema: options.many ? z.array(z.string()) : z.string()
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
