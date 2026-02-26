import { describe, it, expect } from 'vitest'
import { field, text, number } from '../src'
import { required, optional, unique, indexed, defaultValue, label, description } from '../src/field-utils'

describe('field utilities', () => {
  describe('required', () => {
    it('marks field as required', () => {
      const f = field({
        fieldType: text(),
        ...required()
      })
      expect(f.required).toBe(true)
    })
  })

  describe('optional', () => {
    it('marks field as optional', () => {
      const f = field({
        fieldType: text(),
        ...optional()
      })
      expect(f.required).toBe(false)
    })
  })

  describe('unique', () => {
    it('marks field as unique', () => {
      const f = field({
        fieldType: text(),
        ...unique()
      })
      expect(f.unique).toBe(true)
    })
  })

  describe('indexed', () => {
    it('marks field as indexed', () => {
      const f = field({
        fieldType: text(),
        ...indexed()
      })
      expect(f.indexed).toBe(true)
    })
  })

  describe('defaultValue', () => {
    it('sets default value', () => {
      const f = field({
        fieldType: number(),
        ...defaultValue(18)
      })
      expect(f.default).toBe(18)
    })
  })

  describe('label', () => {
    it('sets label', () => {
      const f = field({
        fieldType: text(),
        ...label('Name')
      })
      expect(f.label).toBe('Name')
    })
  })

  describe('description', () => {
    it('sets description', () => {
      const f = field({
        fieldType: text(),
        ...description('User name')
      })
      expect(f.description).toBe('User name')
    })
  })

  it('combines multiple utilities', () => {
    const f = field({
      fieldType: text(),
      ...required(),
      ...unique(),
      ...indexed(),
      ...defaultValue('John'),
      ...label('Name'),
      ...description('User name')
    })

    expect(f.required).toBe(true)
    expect(f.unique).toBe(true)
    expect(f.indexed).toBe(true)
    expect(f.default).toBe('John')
    expect(f.label).toBe('Name')
    expect(f.description).toBe('User name')
  })
})
