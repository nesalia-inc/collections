import { describe, it, expect } from 'vitest'
import { fieldType } from './field-type'
import { field } from './field'
import { text, number, boolean, date, timestamp, enumField, json, array, relation } from './fields'
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
    const myField = field({ fieldType: text })

    expect(myField.required).toBe(false)
    expect(myField.unique).toBe(false)
    expect(myField.indexed).toBe(false)
  })

  it('creates a field with options', () => {
    const myField = field({
      fieldType: text,
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
    const textField = field({ fieldType: text })
    const numberField = field({ fieldType: number })
    const booleanField = field({ fieldType: boolean })
    const dateField = field({ fieldType: date })
    const timestampField = field({ fieldType: timestamp })

    expect(textField.fieldType().schema).toBeInstanceOf(z.ZodString)
    expect(numberField.fieldType().schema).toBeInstanceOf(z.ZodNumber)
    expect(booleanField.fieldType().schema).toBeInstanceOf(z.ZodBoolean)
    expect(dateField.fieldType().schema).toBeInstanceOf(z.ZodDate)
    expect(timestampField.fieldType().schema).toBeInstanceOf(z.ZodDate)
  })
})

describe('built-in field types', () => {
  it('text field type', () => {
    const instance = text()
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
    const instance = number()
    expect(instance.schema).toBeInstanceOf(z.ZodNumber)
  })

  it('boolean field type', () => {
    const instance = boolean()
    expect(instance.schema).toBeInstanceOf(z.ZodBoolean)
  })

  it('date field type', () => {
    const instance = date()
    expect(instance.schema).toBeInstanceOf(z.ZodDate)
  })

  it('timestamp field type', () => {
    const instance = timestamp()
    expect(instance.schema).toBeInstanceOf(z.ZodDate)
  })

  it('enum field type', () => {
    const status = enumField(['draft', 'published', 'archived'])
    const instance = status()
    expect(instance.schema).toBeInstanceOf(z.ZodEnum)
  })

  it('json field type', () => {
    const instance = json()()
    expect(instance.schema).toBeInstanceOf(z.ZodAny)
  })

  it('array field type', () => {
    const instance = array(z.string())()
    expect(instance.schema).toBeInstanceOf(z.ZodArray)
  })

  it('relation field type - one-to-many', () => {
    const instance = relation({ collection: 'users' })()
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
    const instance = relation({ collection: 'profiles', singular: true })()
    expect(instance.database.singular).toBe(true)
  })

  it('relation field type - many-to-many', () => {
    const instance = relation({ collection: 'tags', many: true })()
    expect(instance.schema).toBeInstanceOf(z.ZodArray)
    expect(instance.database.many).toBe(true)
  })
})

describe('field with built-in types', () => {
  it('creates a field with text type', () => {
    const myField = field({ fieldType: text })
    expect(myField.fieldType().schema).toBeInstanceOf(z.ZodString)
  })

  it('creates a field with number type', () => {
    const myField = field({ fieldType: number })
    expect(myField.fieldType().schema).toBeInstanceOf(z.ZodNumber)
  })

  it('creates a field with relation type', () => {
    const myField = field({
      fieldType: relation({ collection: 'users' }),
      required: true
    })
    expect(myField.required).toBe(true)
    expect(myField.fieldType().database.references).toBe('users')
  })
})
