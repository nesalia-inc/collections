import { describe, it, expect } from 'vitest'
import { field, fieldType, f } from '../src/fields'
import { z } from 'zod'

describe('fieldType', () => {
  it('creates a field type with type, schema, and columnType', () => {
    const textFieldType = fieldType({
      type: 'text',
      schema: z.string(),
      columnType: { name: 'varchar', length: 255 },
    })

    expect(textFieldType.type).toBe('text')
    expect(textFieldType.columnType).toEqual({ name: 'varchar', length: 255 })
    expect(textFieldType.schema).toBeDefined()
  })

  it('creates a field type with a transform function', () => {
    const emailFieldType = fieldType({
      type: 'email',
      schema: z.string().email(),
      columnType: { name: 'varchar', length: 255 },
      transform: (value: unknown) => String(value).toLowerCase().trim(),
    })

    expect(emailFieldType.transform).toBeDefined()
    expect(emailFieldType.transform!('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
  })
})

describe('f - predefined field types', () => {
  describe('text', () => {
    it('creates a text field type', () => {
      const textField = f.text()

      expect(textField.type).toBe('text')
      expect(textField.columnType).toEqual({ name: 'varchar', length: 255 })
      expect(textField.schema).toBeDefined()
    })

    it('validates string input', () => {
      const textField = f.text()
      const result = textField.schema.safeParse('hello')

      expect(result.success).toBe(true)
    })
  })

  describe('email', () => {
    it('creates an email field type', () => {
      const emailField = f.email()

      expect(emailField.type).toBe('email')
      expect(emailField.columnType).toEqual({ name: 'varchar', length: 255 })
      expect(emailField.transform).toBeDefined()
    })

    it('validates email format', () => {
      const emailField = f.email()

      expect(emailField.schema.safeParse('test@example.com').success).toBe(true)
      expect(emailField.schema.safeParse('invalid-email').success).toBe(false)
    })

    it('transforms email to lowercase and trims', () => {
      const emailField = f.email()
      const transformed = emailField.transform!('  TEST@EXAMPLE.COM  ')

      expect(transformed).toBe('test@example.com')
    })
  })

  describe('url', () => {
    it('creates a url field type', () => {
      const urlField = f.url()

      expect(urlField.type).toBe('url')
      expect(urlField.schema.safeParse('https://example.com').success).toBe(true)
      expect(urlField.schema.safeParse('not-a-url').success).toBe(false)
    })
  })

  describe('number', () => {
    it('creates a number field type', () => {
      const numberField = f.number()

      expect(numberField.type).toBe('number')
      expect(numberField.columnType).toEqual({ name: 'integer' })
      expect(numberField.schema.safeParse(42).success).toBe(true)
      expect(numberField.schema.safeParse('not a number').success).toBe(false)
    })
  })

  describe('decimal', () => {
    it('creates a decimal field type with precision and scale', () => {
      const decimalField = f.decimal(10, 2)

      expect(decimalField.type).toBe('decimal')
      expect(decimalField.columnType).toEqual({ name: 'decimal', precision: 10, scale: 2 })
      expect(decimalField.schema.safeParse(12345.67).success).toBe(true)
    })
  })

  describe('boolean', () => {
    it('creates a boolean field type', () => {
      const boolField = f.boolean()

      expect(boolField.type).toBe('boolean')
      expect(boolField.columnType).toEqual({ name: 'boolean' })
      expect(boolField.schema.safeParse(true).success).toBe(true)
      expect(boolField.schema.safeParse(false).success).toBe(true)
    })
  })

  describe('date', () => {
    it('creates a date field type', () => {
      const dateField = f.date()

      expect(dateField.type).toBe('date')
      expect(dateField.columnType).toEqual({ name: 'date' })
      expect(dateField.schema.safeParse(new Date()).success).toBe(true)
    })
  })

  describe('timestamp', () => {
    it('creates a timestamp field type', () => {
      const tsField = f.timestamp()

      expect(tsField.type).toBe('timestamp')
      expect(tsField.columnType).toEqual({ name: 'timestamp' })
    })
  })

  describe('timestampTz', () => {
    it('creates a timestamp with timezone field type', () => {
      const tsTzField = f.timestampTz()

      expect(tsTzField.type).toBe('timestamptz')
      expect(tsTzField.columnType).toEqual({ name: 'timestamptz' })
    })
  })

  describe('json', () => {
    it('creates a json field type', () => {
      const jsonField = f.json()

      expect(jsonField.type).toBe('json')
      expect(jsonField.columnType).toEqual({ name: 'json' })
      expect(jsonField.schema.safeParse({ key: 'value' }).success).toBe(true)
      expect(jsonField.schema.safeParse([1, 2, 3]).success).toBe(true)
    })
  })

  describe('jsonb', () => {
    it('creates a jsonb field type', () => {
      const jsonbField = f.jsonb()

      expect(jsonbField.type).toBe('jsonb')
      expect(jsonbField.columnType).toEqual({ name: 'jsonb' })
    })
  })

  describe('uuid', () => {
    it('creates a uuid field type', () => {
      const uuidField = f.uuid()

      expect(uuidField.type).toBe('uuid')
      expect(uuidField.columnType).toEqual({ name: 'uuid' })
      expect(uuidField.schema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
      expect(uuidField.schema.safeParse('not-a-uuid').success).toBe(false)
    })
  })

  describe('select', () => {
    it('creates a select field type with values', () => {
      const statusField = f.select(['draft', 'published', 'archived'] as const)

      expect(statusField.type).toBe('select')
      expect(statusField.columnType).toEqual({ name: 'enum', values: ['draft', 'published', 'archived'] })
      expect(statusField.schema.safeParse('draft').success).toBe(true)
      expect(statusField.schema.safeParse('invalid').success).toBe(false)
    })

    it('returns correct TypeScript type', () => {
      const statusField = f.select(['draft', 'published'] as const)

      type StatusValue = ReturnType<typeof statusField>

      // Type test: 'draft' should be valid
      const draftParse = statusField.schema.safeParse('draft')
      expect(draftParse.success).toBe(true)
    })
  })

  describe('relation', () => {
    it('creates a relation field type', () => {
      const relationField = f.relation()

      expect(relationField.type).toBe('relation')
      expect(relationField.columnType).toEqual({ name: 'uuid' })
    })
  })

  describe('array', () => {
    it('creates an array field type', () => {
      const arrayField = f.array(f.text())

      expect(arrayField.type).toBe('array')
      expect(arrayField.columnType).toEqual({ name: 'json' })
      expect(arrayField.schema.safeParse(['a', 'b', 'c']).success).toBe(true)
    })
  })

  describe('richtext', () => {
    it('creates a richtext field type', () => {
      const richtextField = f.richtext()

      expect(richtextField.type).toBe('richtext')
      expect(richtextField.columnType).toEqual({ name: 'text' })
    })
  })

  describe('file', () => {
    it('creates a file field type', () => {
      const fileField = f.file()

      expect(fileField.type).toBe('file')
      expect(fileField.columnType).toEqual({ name: 'varchar', length: 500 })
      expect(fileField.schema.safeParse(undefined).success).toBe(true)
      expect(fileField.schema.safeParse('/path/to/file.txt').success).toBe(true)
    })
  })
})

describe('field', () => {
  it('creates a field with fieldType', () => {
    const nameField = field({ fieldType: f.text() })

    expect(nameField.fieldType.type).toBe('text')
    expect(nameField.required).toBe(false)
    expect(nameField.unique).toBe(false)
    expect(nameField.indexed).toBe(false)
  })

  it('creates a required field', () => {
    const requiredField = field({ fieldType: f.text(), required: true })

    expect(requiredField.required).toBe(true)
  })

  it('creates a unique field', () => {
    const uniqueField = field({ fieldType: f.email(), unique: true })

    expect(uniqueField.unique).toBe(true)
  })

  it('creates an indexed field', () => {
    const indexedField = field({ fieldType: f.text(), indexed: true })

    expect(indexedField.indexed).toBe(true)
  })

  it('creates a field with a static default value', () => {
    const statusField = field({
      fieldType: f.select(['active', 'inactive'] as const),
      defaultValue: 'active',
    })

    expect(statusField.defaultValue).toBeDefined()
    expect(statusField.defaultValue!()).toBe('active')
  })

  it('creates a field with a function default value', () => {
    const timestampField = field({
      fieldType: f.timestamp(),
      defaultValue: () => new Date(),
    })

    expect(timestampField.defaultValue).toBeDefined()
    expect(timestampField.defaultValue!()).toBeInstanceOf(Date)
  })

  it('creates a field with no default value', () => {
    const nameField = field({ fieldType: f.text() })

    expect(nameField.defaultValue).toBeUndefined()
  })

  it('returns a frozen field object', () => {
    const nameField = field({ fieldType: f.text() })

    expect(Object.isFrozen(nameField)).toBe(true)
    expect(Object.isFrozen(nameField.fieldType)).toBe(true)
  })
})
