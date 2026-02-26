import { describe, it, expect } from 'vitest'
import { field } from '../src'
import { f } from '../src'
import { required, optional, unique, indexed, defaultValue, label, description } from '../src/field-utils'

describe('field utilities', () => {
  describe('required', () => {
    it('marks field as required', () => {
      const myField = required(field({ fieldType: f.text() }))
      expect(myField.required).toBe(true)
    })
  })

  describe('optional', () => {
    it('marks field as optional', () => {
      const myField = optional(field({ fieldType: f.text() }))
      expect(myField.required).toBe(false)
    })
  })

  describe('unique', () => {
    it('marks field as unique', () => {
      const myField = unique(field({ fieldType: f.text() }))
      expect(myField.unique).toBe(true)
    })
  })

  describe('indexed', () => {
    it('marks field as indexed', () => {
      const myField = indexed(field({ fieldType: f.text() }))
      expect(myField.indexed).toBe(true)
    })
  })

  describe('defaultValue', () => {
    it('sets default value', () => {
      const myField = defaultValue(18, field({ fieldType: f.number() }))
      expect(myField.default).toBe(18)
    })
  })

  describe('label', () => {
    it('sets label', () => {
      const myField = label('Name', field({ fieldType: f.text() }))
      expect(myField.label).toBe('Name')
    })
  })

  describe('description', () => {
    it('sets description', () => {
      const myField = description('User name', field({ fieldType: f.text() }))
      expect(myField.description).toBe('User name')
    })
  })

  it('composes multiple utilities', () => {
    const baseField = field({ fieldType: f.text() })
    const myField = required(unique(indexed(defaultValue('John', label('Name', description('User name', baseField))))))

    expect(myField.required).toBe(true)
    expect(myField.unique).toBe(true)
    expect(myField.indexed).toBe(true)
    expect(myField.default).toBe('John')
    expect(myField.label).toBe('Name')
    expect(myField.description).toBe('User name')
  })
})
