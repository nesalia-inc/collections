import { describe, it, expect } from 'vitest'
import { field, fieldType, f, safeTransform, safeTransformArray, TransformError, isField } from '../src/fields'
import { z } from 'zod'

describe('fieldType', () => {
  it('creates a field type with type, schema, and columnType', () => {
    const textFieldType = fieldType({
      type: 'text',
      schema: z.string(),
      buildColumnType: () => ({ name: 'varchar', length: 255 }),
    })()

    expect(textFieldType.type).toBe('text')
    expect(textFieldType.columnType).toEqual({ name: 'varchar', length: 255 })
    expect(textFieldType.schema).toBeDefined()
  })

  it('creates a field type with a transform function', () => {
    const emailFieldType = fieldType({
      type: 'email',
      schema: z.string().email(),
      buildColumnType: () => ({ name: 'varchar', length: 255 }),
      transform: (value: unknown) => String(value).toLowerCase().trim(),
    })()

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

    it('applies minLength and maxLength constraints', () => {
      const boundedField = f.text({ minLength: 3, maxLength: 10 })

      expect(boundedField.schema.safeParse('hello').success).toBe(true)
      expect(boundedField.schema.safeParse('hi').success).toBe(false)
      expect(boundedField.schema.safeParse('this is too long').success).toBe(false)
    })

    it('applies pattern constraint', () => {
      const patternedField = f.text({ pattern: '^[A-Z][a-z]+$' })

      expect(patternedField.schema.safeParse('Hello').success).toBe(true)
      expect(patternedField.schema.safeParse('hello').success).toBe(false)
    })

    it('applies extend option', () => {
      const extendedField = f.text({
        extend: (s) => s.email()
      })

      expect(extendedField.schema.safeParse('test@example.com').success).toBe(true)
      expect(extendedField.schema.safeParse('not-an-email').success).toBe(false)
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

    it('applies min and max constraints', () => {
      const boundedField = f.number({ min: 0, max: 100 })

      expect(boundedField.schema.safeParse(50).success).toBe(true)
      expect(boundedField.schema.safeParse(-1).success).toBe(false)
      expect(boundedField.schema.safeParse(101).success).toBe(false)
    })

    it('applies extend option', () => {
      const extendedField = f.number({
        extend: (s) => s.refine((v) => v > 0, { message: 'must be positive' })
      })

      expect(extendedField.schema.safeParse(5).success).toBe(true)
      expect(extendedField.schema.safeParse(-5).success).toBe(false)
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

  it('creates a field with a defaultFactory', () => {
    const timestampField = field({
      fieldType: f.timestamp(),
      defaultFactory: () => new Date(),
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

  it('throws when defaultValue does not match fieldType schema', () => {
    expect(() => {
      field({
        fieldType: f.number(),
        defaultValue: 'not a number' as unknown as number,
      })
    }).toThrow()
  })

  it('throws with descriptive error message for invalid defaultValue', () => {
    expect(() => {
      field({
        fieldType: f.number(),
        defaultValue: 'not a number' as unknown as number,
      })
    }).toThrow(/Invalid defaultValue for field type 'number'/)
  })
})

describe('safeTransform', () => {
  it('returns transformed value on success', () => {
    const result = safeTransform('text', (v) => String(v).toUpperCase(), 'hello')
    expect(result).toBe('HELLO')
  })

  it('throws TransformError on transform failure', () => {
    expect(() => {
      safeTransform('text', () => {
        throw new Error('transform failed')
      }, 'value')
    }).toThrow(TransformError)
  })

  it('TransformError contains fieldType, value, and cause', () => {
    try {
      safeTransform('email', () => {
        throw new Error('invalid')
      }, 'test')
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(TransformError)
      const err = e as TransformError
      expect(err.fieldType).toBe('email')
      expect(err.value).toBe('test')
      expect(err.cause).toBeInstanceOf(Error)
    }
  })

  it('handles non-Error thrown values', () => {
    try {
      safeTransform('text', () => {
        throw 'string error'
      }, 'value')
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(TransformError)
      const err = e as TransformError
      expect(err.message).toContain('string error')
    }
  })
})

describe('safeTransformArray', () => {
  it('returns empty array for non-array input', () => {
    const result = safeTransformArray('text', (v) => String(v), null)
    expect(result).toEqual([])
  })

  it('transforms each item in array', () => {
    const result = safeTransformArray('number', (v) => Number(v) * 2, [1, 2, 3])
    expect(result).toEqual([2, 4, 6])
  })

  it('throws TransformError when item transform fails', () => {
    expect(() => {
      safeTransformArray('text', () => {
        throw new Error('item transform failed')
      }, ['a', 'b', 'c'])
    }).toThrow(TransformError)
  })

  it('handles non-Error thrown values in array', () => {
    try {
      safeTransformArray('text', () => {
        throw 'string error'
      }, ['a', 'b', 'c'])
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(TransformError)
    }
  })
})

describe('isField', () => {
  it('returns true for valid Field object', () => {
    const myField = field({ fieldType: f.text() })
    expect(isField(myField)).toBe(true)
  })

  it('returns false for non-object values', () => {
    expect(isField(null)).toBe(false)
    expect(isField(undefined)).toBe(false)
    expect(isField('string')).toBe(false)
    expect(isField(123)).toBe(false)
    expect(isField([])).toBe(false)
  })

  it('returns false for object missing required properties', () => {
    expect(isField({ fieldType: {} })).toBe(false)
    expect(isField({ fieldType: { type: 'text' } })).toBe(false)
    expect(isField({ fieldType: {}, required: false })).toBe(false)
  })

  it('returns true for field-like object with all properties', () => {
    const obj = {
      fieldType: { type: 'text' },
      required: false,
      unique: false,
      indexed: false,
    }
    expect(isField(obj)).toBe(true)
  })
})
