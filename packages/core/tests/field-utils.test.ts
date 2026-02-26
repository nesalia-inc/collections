import { describe, it, expect } from 'vitest'
import { field, f } from '../src'
import { required, optional, unique, indexed, defaultValue, label, description } from '../src/field-utils'

describe('field utilities', () => {
  describe('required', () => {
    it('marks field as required', () => {
      const myField = field({
        fieldType: f.text(),
        ...required()
      })
      expect(myField.required).toBe(true)
    })
  })

  describe('optional', () => {
    it('marks field as optional', () => {
      const myField = field({
        fieldType: f.text(),
        ...optional()
      })
      expect(myField.required).toBe(false)
    })
  })

  describe('unique', () => {
    it('marks field as unique', () => {
      const myField = field({
        fieldType: f.text(),
        ...unique()
      })
      expect(myField.unique).toBe(true)
    })
  })

  describe('indexed', () => {
    it('marks field as indexed', () => {
      const myField = field({
        fieldType: f.text(),
        ...indexed()
      })
      expect(myField.indexed).toBe(true)
    })
  })

  describe('defaultValue', () => {
    it('sets default value', () => {
      const myField = field({
        fieldType: f.number(),
        ...defaultValue(18)
      })
      expect(myField.default).toBe(18)
    })
  })

  describe('label', () => {
    it('sets label', () => {
      const myField = field({
        fieldType: f.text(),
        ...label('Name')
      })
      expect(myField.label).toBe('Name')
    })
  })

  describe('description', () => {
    it('sets description', () => {
      const myField = field({
        fieldType: f.text(),
        ...description('User name')
      })
      expect(myField.description).toBe('User name')
    })
  })

  it('combines multiple utilities', () => {
    const myField = field({
      fieldType: f.text(),
      ...required(),
      ...unique(),
      ...indexed(),
      ...defaultValue('John'),
      ...label('Name'),
      ...description('User name')
    })

    expect(myField.required).toBe(true)
    expect(myField.unique).toBe(true)
    expect(myField.indexed).toBe(true)
    expect(myField.default).toBe('John')
    expect(myField.label).toBe('Name')
    expect(myField.description).toBe('User name')
  })
})
