import { describe, it, expect } from 'vitest'
import { field, text, number } from '../src'
import { required, optional, unique, indexed, defaultValue, label, description } from '../src/field-utils'

describe('field utilities', () => {
  describe('required', () => {
    it('marks field as required', () => {
      const f = required(field({ fieldType: text() }))
      expect(f.required).toBe(true)
    })
  })

  describe('optional', () => {
    it('marks field as optional', () => {
      const f = optional(field({ fieldType: text() }))
      expect(f.required).toBe(false)
    })
  })

  describe('unique', () => {
    it('marks field as unique', () => {
      const f = unique(field({ fieldType: text() }))
      expect(f.unique).toBe(true)
    })
  })

  describe('indexed', () => {
    it('marks field as indexed', () => {
      const f = indexed(field({ fieldType: text() }))
      expect(f.indexed).toBe(true)
    })
  })

  describe('defaultValue', () => {
    it('sets default value', () => {
      const f = defaultValue(18)(field({ fieldType: number() }))
      expect(f.default).toBe(18)
    })
  })

  describe('label', () => {
    it('sets label', () => {
      const f = label('Name')(field({ fieldType: text() }))
      expect(f.label).toBe('Name')
    })
  })

  describe('description', () => {
    it('sets description', () => {
      const f = description('User name')(field({ fieldType: text() }))
      expect(f.description).toBe('User name')
    })
  })

  it('composes multiple utilities', () => {
    const f = required(
      unique(
        indexed(
          defaultValue('John')(
            label('Name')(
              description('User name')(
                field({ fieldType: text() })
              )
            )
          )
        )
      )
    )

    expect(f.required).toBe(true)
    expect(f.unique).toBe(true)
    expect(f.indexed).toBe(true)
    expect(f.default).toBe('John')
    expect(f.label).toBe('Name')
    expect(f.description).toBe('User name')
  })

  it('composes utilities with function chaining', () => {
    const f = required(unique(indexed(defaultValue('John')(label('Name')(description('User name')(field({ fieldType: text() })))))))

    expect(f.required).toBe(true)
    expect(f.unique).toBe(true)
    expect(f.indexed).toBe(true)
    expect(f.default).toBe('John')
    expect(f.label).toBe('Name')
    expect(f.description).toBe('User name')
  })
})
