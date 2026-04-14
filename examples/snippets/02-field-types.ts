/**
 * @deessejs/collections Snippet 02: Field Types
 *
 * This example demonstrates all available field types in @deessejs/collections.
 * Field types are created using the `f` factory which provides predefined
 * field type builders.
 *
 * Run with: npx tsx examples/snippets/02-field-types.ts
 */

import { collection, field, f } from '@deessejs/collections'

// =============================================================================
// Text Fields
// =============================================================================

/**
 * f.text() - Basic text field
 * Options: minLength, maxLength, pattern, coerce, extend
 */
const textField = field({
  fieldType: f.text(),
})

const textWithValidation = field({
  fieldType: f.text({
    minLength: 1,
    maxLength: 500,
    pattern: '^[a-zA-Z0-9 ]*$', // Alphanumeric with spaces
  }),
})

/**
 * f.email() - Email field with built-in validation
 * Automatically transforms to lowercase and trims whitespace
 */
const emailField = field({
  fieldType: f.email(),
  required: true,
  unique: true,
})

/**
 * f.url() - URL field with built-in validation
 * Automatically trims whitespace
 */
const urlField = field({
  fieldType: f.url(),
})

/**
 * f.richtext() - Rich text content field
 * Uses text column type, suitable for long-form content
 */
const richtextField = field({
  fieldType: f.richtext(),
})

/**
 * f.uuid() - UUID field with built-in validation
 */
const uuidField = field({
  fieldType: f.uuid(),
  required: true,
})

// =============================================================================
// Number Fields
// =============================================================================

/**
 * f.number() - Numeric field (integer)
 * Options: min, max, coerce
 */
const numberField = field({
  fieldType: f.number(),
})

const ageField = field({
  fieldType: f.number({
    min: 0,
    max: 150,
    coerce: true, // Coerce string input to number
  }),
})

/**
 * f.decimal(precision, scale) - Decimal number with fixed precision
 * Example: decimal(10, 2) can store up to 10 digits with 2 decimal places
 */
const priceField = field({
  fieldType: f.decimal(10, 2),
})

// =============================================================================
// Boolean Field
// =============================================================================

/**
 * f.boolean() - Boolean field
 */
const booleanField = field({
  fieldType: f.boolean(),
})

const isActiveField = field({
  fieldType: f.boolean(),
  defaultValue: true,
})

// =============================================================================
// Date and Time Fields
// =============================================================================

/**
 * f.date() - Date field (date only, no time)
 */
const dateField = field({
  fieldType: f.date(),
})

/**
 * f.timestamp() - Timestamp without timezone
 */
const timestampField = field({
  fieldType: f.timestamp(),
})

/**
 * f.timestampTz() - Timestamp with timezone (recommended for most cases)
 */
const timestampTzField = field({
  fieldType: f.timestampTz(),
})

// =============================================================================
// Select/Enum Fields
// =============================================================================

/**
 * f.select() - Enumeration field with predefined values
 * Pass a tuple of string literal values
 */
const statusField = field({
  fieldType: f.select(['draft', 'published', 'archived']),
  required: true,
  defaultValue: 'draft' as const,
})

const priorityField = field({
  fieldType: f.select(['low', 'medium', 'high', 'critical'] as const),
  defaultValue: 'medium' as const,
})

// =============================================================================
// JSON Fields
// =============================================================================

/**
 * f.json() - JSON field for storing objects or arrays
 * Validates that the value is a valid JSON object or array
 */
const jsonField = field({
  fieldType: f.json(),
})

/**
 * f.jsonb() - JSONB field (binary JSON, better query performance)
 */
const metadataField = field({
  fieldType: f.jsonb(),
})

// =============================================================================
// Array Fields
// =============================================================================

/**
 * f.array() - Array field for storing lists of values
 * Requires specifying the item type
 */
const tagsField = field({
  fieldType: f.array(f.text()),
})

const scoresField = field({
  fieldType: f.array(f.number()),
})

// =============================================================================
// Relation Fields
// =============================================================================

/**
 * f.relation() - Reference to another collection's record
 * Stores a UUID that references another record's primary key
 */
const authorIdField = field({
  fieldType: f.relation(),
})

const parentIdField = field({
  fieldType: f.relation(),
})

// =============================================================================
// Optional Fields
// =============================================================================

/**
 * Fields are optional by default. Use required: true to make them mandatory.
 * The optional/required flag affects validation, not the database column
 * (which may still allow NULL values).
 */
const optionalText = field({
  fieldType: f.text(),
  required: false, // This is the default
})

// =============================================================================
// Fields with Default Values
// =============================================================================

/**
 * Use defaultValue for static defaults or defaultFactory for dynamic ones.
 * defaultFactory is called each time a new record is created.
 */
const withStaticDefault = field({
  fieldType: f.select(['active', 'inactive']),
  defaultValue: 'active' as const,
})

const withFactoryDefault = field({
  fieldType: f.timestamp(),
  defaultFactory: () => new Date(), // Called per-record creation
})

// =============================================================================
// Creating a Collection with All Field Types
// =============================================================================

/**
 * This collection demonstrates using many field types together.
 * In practice, you'd split these into separate collections.
 */
const demoCollection = collection({
  slug: 'demo-collection',
  fields: {
    // Core fields
    title: field({ fieldType: f.text(), required: true }),
    slug: field({ fieldType: f.text() }),
    email: field({ fieldType: f.email() }),
    website: field({ fieldType: f.url() }),
    body: field({ fieldType: f.richtext() }),

    // Numeric fields
    age: ageField,
    price: priceField,
    rating: field({ fieldType: f.number({ min: 0, max: 5 }) }),

    // Boolean fields
    isActive: isActiveField,
    isFeatured: booleanField,

    // Date fields
    birthDate: dateField,
    publishedAt: field({ fieldType: f.timestamp() }),
    modifiedAt: field({ fieldType: f.timestampTz() }),

    // Select/enum fields
    status: statusField,
    priority: priorityField,

    // JSON fields
    metadata: metadataField,
    config: jsonField,

    // Array fields
    tags: tagsField,
    scores: scoresField,

    // Relation fields
    authorId: authorIdField,
    parentId: parentIdField,

    // UUID
    reference: uuidField,

    // Optional file path
    avatar: field({ fieldType: f.file() }),
  },
})

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Field Types ===')
console.log(`Demo collection: ${demoCollection.slug}`)
console.log(`Fields:`, Object.keys(demoCollection.fields))
console.log('')
console.log('Field type examples:')
console.log(`- text field type: ${textField.fieldType.type}`)
console.log(`- email field type: ${emailField.fieldType.type}`)
console.log(`- number field type: ${numberField.fieldType.type}`)
console.log(`- boolean field type: ${booleanField.fieldType.type}`)
console.log(`- select field type: ${statusField.fieldType.type}`)
console.log(`- uuid field type: ${uuidField.fieldType.type}`)
console.log('')
console.log('Field types demonstration complete!')
