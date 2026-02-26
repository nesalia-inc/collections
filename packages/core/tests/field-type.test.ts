import { describe, it, expect } from 'vitest'
import { fieldType } from '../src/field-type'
import { field } from '../src/field'
import * as f from '../src/fields'
import { z } from 'zod'

describe('fieldType', () => {
  it('creates a basic field type', () => {
    const textField = fieldType({
      schema: z.string(),
      database: { type: 'text' }
    })

    const instance = textField()

    expect(instance.schema).toBeInstanceOf(z.ZodString)
    expect(instance.database).toEqual({ type: 'text' })
  })
})

describe('field', () => {
  it('creates a basic field', () => {
    const myField = field({ fieldType: f.text() })

    expect(myField.required).toBe(false)
    expect(myField.unique).toBe(false)
    expect(myField.indexed).toBe(false)
  })

  it('creates a field with options', () => {
    const myField = field({
      fieldType: f.text(),
      required: true,
      unique: true,
      indexed: true,
      default: 'default value',
      label: 'Name',
      description: 'User name'
    })

    expect(myField.required).toBe(true)
    expect(myField.unique).toBe(true)
    expect(myField.indexed).toBe(true)
    expect(myField.default).toBe('default value')
    expect(myField.label).toBe('Name')
    expect(myField.description).toBe('User name')
  })

  it('works with different field types', () => {
    const textField = field({ fieldType: f.text() })
    const numberField = field({ fieldType: f.number() })
    const booleanField = field({ fieldType: f.boolean() })
    const dateField = field({ fieldType: f.date() })
    const timestampField = field({ fieldType: f.timestamp() })

    expect(textField.fieldType.schema).toBeInstanceOf(z.ZodString)
    expect(numberField.fieldType.schema).toBeInstanceOf(z.ZodNumber)
    expect(booleanField.fieldType.schema).toBeInstanceOf(z.ZodBoolean)
    expect(dateField.fieldType.schema).toBeInstanceOf(z.ZodDate)
    expect(timestampField.fieldType.schema).toBeInstanceOf(z.ZodDate)
  })
})

describe('built-in field types', () => {
  it('text field type', () => {
    const instance = f.text()
    expect(instance.schema).toBeInstanceOf(z.ZodString)
    expect(instance.database).toEqual({ type: 'text' })
  })

  it('email field type', () => {
    const emailField = fieldType({
      schema: z.string().email(),
      database: { type: 'text' }
    })
    const instance = emailField()
    expect(instance.schema).toBeInstanceOf(z.ZodString)
  })

  it('number field type', () => {
    const instance = f.number()
    expect(instance.schema).toBeInstanceOf(z.ZodNumber)
  })

  it('boolean field type', () => {
    const instance = f.boolean()
    expect(instance.schema).toBeInstanceOf(z.ZodBoolean)
  })

  it('date field type', () => {
    const instance = f.date()
    expect(instance.schema).toBeInstanceOf(z.ZodDate)
  })

  it('timestamp field type', () => {
    const instance = f.timestamp()
    expect(instance.schema).toBeInstanceOf(z.ZodDate)
  })

  it('enum field type', () => {
    const status = f.select(['draft', 'published', 'archived'])
    expect(status.schema).toBeInstanceOf(z.ZodEnum)
  })

  it('json field type', () => {
    const instance = f.json()
    expect(instance.schema).toBeInstanceOf(z.ZodAny)
  })

  it('array field type', () => {
    const instance = f.array(z.string())
    expect(instance.schema).toBeInstanceOf(z.ZodArray)
  })

  it('relation field type - one-to-many', () => {
    const instance = f.relation({ collection: 'users' })
    expect(instance.schema).toBeInstanceOf(z.ZodString)
    expect(instance.database).toEqual({
      type: 'integer',
      references: 'users',
      through: undefined,
      many: false,
      singular: false
    })
  })

  it('relation field type - one-to-one', () => {
    const instance = f.relation({ collection: 'profiles', singular: true })
    expect(instance.database.singular).toBe(true)
  })

  it('relation field type - many-to-many', () => {
    const instance = f.relation({ collection: 'tags', many: true })
    expect(instance.schema).toBeInstanceOf(z.ZodArray)
    expect(instance.database.many).toBe(true)
  })
})

describe('field with built-in types', () => {
  it('creates a field with text type', () => {
    const myField = field({ fieldType: f.text() })
    expect(myField.fieldType.schema).toBeInstanceOf(z.ZodString)
  })

  it('creates a field with number type', () => {
    const myField = field({ fieldType: f.number() })
    expect(myField.fieldType.schema).toBeInstanceOf(z.ZodNumber)
  })

  it('creates a field with relation type', () => {
    const myField = field({
      fieldType: f.relation({ collection: 'users' }),
      required: true
    })
    expect(myField.required).toBe(true)
    expect(myField.fieldType.database.references).toBe('users')
  })
})
