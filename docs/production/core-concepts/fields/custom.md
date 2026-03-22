# Custom Field Types

Create your own custom field types for specialized data needs.

## Overview

You can extend the built-in field types with custom types that include specific validation and storage behavior.

## Using `fieldType()`

```typescript
import { fieldType, collection, field } from '@deessejs/collections'
import { z } from 'zod'

// Create a custom field type with validation
const colorPicker = fieldType({
  // The Zod schema for validation
  schema: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a hex color'),

  // How to store in the database
  columnType: 'text'
})

// Or with options for flexibility
const phoneNumber = (countryCode: string = 'US') => fieldType({
  schema: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number'),
  columnType: 'text'
})
```

## Using in Collections

```typescript
const products = collection({
  slug: 'products',
  fields: {
    name: field({ fieldType: f.text() }),
    // Use your custom field type
    hexColor: field({ fieldType: colorPicker() }),
    // Use parameterized custom field
    phone: field({ fieldType: phoneNumber('FR') })
  }
})
```

## Example: ColorPicker

```typescript
import { fieldType, collection, field } from '@deessejs/collections'
import { z } from 'zod'

// Define the custom field type
const ColorPicker = fieldType({
  schema: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  columnType: 'text'
})

// Use it in a collection
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    accentColor: field({
      fieldType: ColorPicker(),
      defaultValue: '#000000'
    })
  }
})
```

## Example: Phone Number

```typescript
const PhoneNumber = (defaultCountry?: string) => fieldType({
  schema: z.string().min(10).max(15),
  columnType: 'text'
})

const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() }),
    phone: field({
      fieldType: PhoneNumber('US'),
      defaultValue: '+1'
    })
  }
})
```

## With Zod Refine

Add custom validation logic:

```typescript
const strongPassword = fieldType({
  schema: z.string()
    .min(8)
    .refine(
      (val) => /[A-Z]/.test(val) && /[0-9]/.test(val),
      'Password must contain uppercase and number'
    ),
  columnType: 'text'
})
```

## Plugin Integration

Custom field types can be distributed via plugins. See [Plugins](../features/plugins/README.md) for more details.

## asJson Method

Custom field types also support the `asJson()` method. The returned JSON includes the custom type identifier, allowing plugins and database providers to recognize and handle custom fields appropriately.

```typescript
const colorPicker = fieldType({
  schema: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  columnType: 'text'
})

const colorField = field({ fieldType: colorPicker() })

// asJson includes the custom field type info
const json = colorField.asJson()
// {
//   name: 'color',
//   fieldType: { type: 'fieldType', value: [Function] },
//   required: false,
//   ...
// }
```
