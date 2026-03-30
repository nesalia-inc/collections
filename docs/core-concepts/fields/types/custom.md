# Custom Field Types

Use `fieldType` to create custom field types with full control.

## Usage

```typescript
import { field, fieldType, z } from '@deessejs/collections'

// Simple custom field
const customText = fieldType({
  type: 'customText',
  schema: z.string(),
  buildColumnType: () => varchar(255)
})

// Custom field with options
const customEmail = fieldType({
  type: 'customEmail',
  schema: z.string().email(),
  buildColumnType: () => varchar(255),
  options: {
    customDomain: { schema: z.string().optional() }
  },
  applyOptions: (schema, options) => {
    if (options.customDomain) {
      // Apply domain validation
      return schema.refine(
        (val) => val.endsWith(`@${options.customDomain}`),
        { message: `Email must be from ${options.customDomain}` }
      )
    }
    return schema
  }
})

// Usage
const myField = field({ fieldType: customText })
const emailField = field({ fieldType: customEmail({ customDomain: 'example.com' }) })
```

## Function Signature

```typescript
function fieldType<T, Options extends FieldTypeOptionsConfig>(
  config: FieldTypeConfig<T, Options>
): FieldTypeBuilder<T, Options>
```

## FieldTypeConfig

```typescript
interface FieldTypeConfig<T, Options extends FieldTypeOptionsConfig = {}> {
  /** Unique identifier for this field type */
  readonly type: string

  /** Base Zod schema for validation */
  readonly schema: z.ZodType<T>

  /** Options configuration */
  readonly options?: Options

  /** Function to apply options to the schema */
  readonly applyOptions?: (schema: z.ZodType<T>, options: ResolvedOptions<Options>) => z.ZodType<T>

  /** Function to build the column type from options */
  readonly buildColumnType: (options: ResolvedOptions<Options>) => ColumnType

  /** Optional transform function for data preparation */
  readonly transform?: (value: unknown) => T
}
```

## Options Configuration

Each option needs a schema and optionally a default value:

```typescript
options: {
  minLength: { schema: z.number().optional() },
  maxLength: { schema: z.number().optional() },
  required: { schema: z.boolean(), default: false }
}
```

## ResolvedOptions

The `ResolvedOptions` type is inferred from the `options` config:

```typescript
type ResolvedOptions<Options extends FieldTypeOptionsConfig> = {
  [K in keyof Options]?: z.infer<Options[K]['schema']>
}
```

## Example: Phone Number Field

```typescript
import { field, fieldType, z, varchar } from '@deessejs/collections'

const phoneNumber = fieldType({
  type: 'phoneNumber',
  schema: z.string(),
  options: {
    countryCode: { schema: z.string().default('+1') },
    format: { schema: z.enum(['national', 'international']).default('national') }
  },
  applyOptions: (schema, options) => {
    return schema
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .transform((val) => {
        if (options.format === 'international') {
          return val
        }
        return val.replace(/^\+\d+/, '') // Strip country code
      })
  },
  buildColumnType: () => varchar(20)
})

// Usage
const workPhone = field({ fieldType: phoneNumber({ format: 'national' }) })
const mobilePhone = field({ fieldType: phoneNumber({ countryCode: '+44', format: 'international' }) })
```

## Example: Bounded Number

```typescript
const boundedNumber = <T extends number>(min: T, max: T) =>
  fieldType({
    type: 'boundedNumber',
    schema: z.number(),
    buildColumnType: () => integer(),
    applyOptions: (_schema, _options) => {
      return z.number().min(min).max(max)
    }
  })

const percentage = boundedNumber(0, 100)
const age = boundedNumber(0, 150)
```

## Field Type Builder Pattern

The `fieldType` function returns a `FieldTypeBuilder` that can be called with options:

```typescript
const textField = fieldType({
  type: 'text',
  schema: z.string(),
  buildColumnType: () => varchar(255)
})

// fieldType returns a builder function
const textFieldType = textField({ maxLength: 100 })

// Which returns a FieldType when called
const fieldDef = textFieldType({ maxLength: 100 })
// {
//   type: 'text',
//   schema: ZodString with max constraint,
//   columnType: ColumnType (varchar(255)),
//   transform: identity function
// }
```

## Transform Function

The transform runs during field value preparation:

```typescript
const trimmedString = fieldType({
  type: 'trimmedString',
  schema: z.string(),
  buildColumnType: () => varchar(255),
  transform: (value) => {
    if (typeof value === 'string') {
      return value.trim()
    }
    return String(value).trim()
  }
})
```
