import { describe, it, expect } from 'vitest'
import { isOk } from '@deessejs/core'
import { field, f } from '../../../src'
import { fieldToRawColumn, type FieldToRawColumnOptions } from '../../../src/adapter/core/fieldToRawColumn'
import { toSnakeCase } from '../../../src/adapter/core/utils'

describe('fieldToRawColumn', () => {
  describe('boolean', () => {
    it('maps f.boolean() to boolean type', () => {
      const fieldDef = field({ fieldType: f.boolean() })
      const result = fieldToRawColumn('isActive', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('boolean')
      expect(result.value.name).toBe('is_active')
    })

    it('sets notNull when required without default', () => {
      const fieldDef = field({ fieldType: f.boolean(), required: true })
      const result = fieldToRawColumn('isActive', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.notNull).toBe(true)
    })

    it('does not set notNull when required with default', () => {
      const fieldDef = field({ fieldType: f.boolean(), required: true, defaultValue: false })
      const result = fieldToRawColumn('isActive', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.notNull).toBeUndefined()
      expect(result.value.default).toBe(false)
    })
  })

  describe('text and varchar', () => {
    it('maps f.text() to varchar type with default length', () => {
      const fieldDef = field({ fieldType: f.text() })
      const result = fieldToRawColumn('firstName', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('varchar')
      expect(result.value.name).toBe('first_name')
    })

    it('maps f.email() to varchar type', () => {
      const fieldDef = field({ fieldType: f.email() })
      const result = fieldToRawColumn('email', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('varchar')
    })

    it('maps f.url() to varchar type', () => {
      const fieldDef = field({ fieldType: f.url() })
      const result = fieldToRawColumn('website', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('varchar')
    })

    it('maps f.file() to varchar type', () => {
      const fieldDef = field({ fieldType: f.file() })
      const result = fieldToRawColumn('avatar', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('varchar')
    })

    it('maps f.richtext() to text type', () => {
      const fieldDef = field({ fieldType: f.richtext() })
      const result = fieldToRawColumn('content', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('text')
    })

    it('converts camelCase field name to snake_case', () => {
      const fieldDef = field({ fieldType: f.text() })
      const result = fieldToRawColumn('userID', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.name).toBe('user_id')
    })

    it('handles already snake_case names', () => {
      const fieldDef = field({ fieldType: f.text() })
      const result = fieldToRawColumn('created_at', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.name).toBe('created_at')
    })
  })

  describe('number types', () => {
    it('maps f.number() to integer type', () => {
      const fieldDef = field({ fieldType: f.number() })
      const result = fieldToRawColumn('age', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('integer')
    })

    it('maps f.decimal() to decimal type with precision and scale', () => {
      const fieldDef = field({ fieldType: f.decimal(10, 2) })
      const result = fieldToRawColumn('price', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('decimal')
      expect(result.value.precision).toBe(10)
      expect(result.value.scale).toBe(2)
    })
  })

  describe('uuid', () => {
    it('maps f.uuid() to uuid type', () => {
      const fieldDef = field({ fieldType: f.uuid() })
      const result = fieldToRawColumn('id', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('uuid')
    })

    it('maps f.relation() to uuid type', () => {
      const fieldDef = field({ fieldType: f.relation() })
      const result = fieldToRawColumn('authorId', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('uuid')
    })
  })

  describe('enum', () => {
    it('maps f.select() to enum type', () => {
      const fieldDef = field({ fieldType: f.select(['draft', 'published', 'archived']) })
      const result = fieldToRawColumn('status', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('enum')
      expect(result.value.enumName).toBe('status')
      expect(result.value.options).toEqual(['draft', 'published', 'archived'])
    })

    it('uses enumNamePrefix when provided', () => {
      const fieldDef = field({ fieldType: f.select(['draft', 'published']) })
      const options: FieldToRawColumnOptions = { enumNamePrefix: 'post_' }
      const result = fieldToRawColumn('status', fieldDef, options)
      expect(isOk(result)).toBe(true)
      expect(result.value.enumName).toBe('post_status')
    })
  })

  describe('date and timestamp', () => {
    it('maps f.date() to date type', () => {
      const fieldDef = field({ fieldType: f.date() })
      const result = fieldToRawColumn('birthday', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('date')
    })

    it('maps f.timestamp() to timestamp type', () => {
      const fieldDef = field({ fieldType: f.timestamp() })
      const result = fieldToRawColumn('createdAt', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('timestamp')
    })

    it('maps f.timestampTz() to timestamptz type', () => {
      const fieldDef = field({ fieldType: f.timestampTz() })
      const result = fieldToRawColumn('updatedAt', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('timestamptz')
    })
  })

  describe('json', () => {
    it('maps f.json() to json type', () => {
      const fieldDef = field({ fieldType: f.json() })
      const result = fieldToRawColumn('metadata', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('json')
    })

    it('maps f.jsonb() to jsonb type', () => {
      const fieldDef = field({ fieldType: f.jsonb() })
      const result = fieldToRawColumn('config', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('jsonb')
    })

    it('maps f.array() to json type (arrays stored as json)', () => {
      const fieldDef = field({ fieldType: f.array(f.text()) })
      const result = fieldToRawColumn('tags', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.type).toBe('json')
    })
  })

  describe('default values', () => {
    it('evaluates defaultValue function at mapping time', () => {
      const fieldDef = field({ fieldType: f.text(), defaultValue: 'hello' })
      const result = fieldToRawColumn('greeting', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.default).toBe('hello')
    })

    it('evaluates defaultFactory at mapping time', () => {
      let callCount = 0
      const fieldDef = field({
        fieldType: f.number(),
        defaultFactory: () => {
          callCount++
          return callCount
        },
      })
      const result = fieldToRawColumn('counter', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.default).toBe(1) // First evaluation
    })

    it('does not set default when no default provided', () => {
      const fieldDef = field({ fieldType: f.text() })
      const result = fieldToRawColumn('title', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.default).toBeUndefined()
    })
  })

  describe('required and notNull', () => {
    it('sets notNull when required without default', () => {
      const fieldDef = field({ fieldType: f.text(), required: true })
      const result = fieldToRawColumn('title', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.notNull).toBe(true)
    })

    it('does not set notNull when required with default', () => {
      const fieldDef = field({ fieldType: f.text(), required: true, defaultValue: 'default' })
      const result = fieldToRawColumn('title', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.notNull).toBeUndefined()
    })

    it('does not set notNull when not required', () => {
      const fieldDef = field({ fieldType: f.text(), required: false })
      const result = fieldToRawColumn('title', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.notNull).toBeUndefined()
    })

    it('does not set notNull when not required but has defaultValue', () => {
      const fieldDef = field({ fieldType: f.text(), required: false, defaultValue: 'default' })
      const result = fieldToRawColumn('title', fieldDef)
      expect(isOk(result)).toBe(true)
      expect(result.value.notNull).toBeUndefined()
    })
  })
})

describe('toSnakeCase', () => {
  it('converts camelCase to snake_case', () => {
    expect(toSnakeCase('firstName')).toBe('first_name')
  })

  it('converts PascalCase to snake_case', () => {
    expect(toSnakeCase('FirstName')).toBe('first_name')
  })

  it('converts consecutive uppercase to separate words', () => {
    expect(toSnakeCase('userID')).toBe('user_id')
    expect(toSnakeCase('XMLParser')).toBe('xml_parser')
  })

  it('handles already snake_case input', () => {
    expect(toSnakeCase('created_at')).toBe('created_at')
  })

  it('handles single letter', () => {
    expect(toSnakeCase('a')).toBe('a')
  })
})
