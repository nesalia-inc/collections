import { describe, it, expect } from 'vitest'
import {
  serial,
  integer,
  numeric,
  decimal,
  real,
  text,
  varchar,
  char,
  bool,
  date,
  timestamp,
  timestamptz,
  json,
  jsonb,
  uuid,
  enum_,
  type ColumnType,
  type ColumnTypeError,
} from '../src/column-types'
import { isError } from '@deessejs/core'

describe('column-types', () => {
  describe('numeric types', () => {
    it('serial returns correct type', () => {
      const result = serial()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'serial' })
    })

    it('integer returns correct type', () => {
      const result = integer()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'integer' })
    })

    it('numeric returns correct type with precision and scale', () => {
      const result = numeric(10, 2)
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'numeric', precision: 10, scale: 2 })
    })

    it('numeric returns error on invalid precision/scale', () => {
      expect(numeric(0, 2).ok).toBe(false)
      expect(numeric(2, 5).ok).toBe(false)
      expect(numeric(-1, 0).ok).toBe(false)
    })

    it('numeric error has correct name and args', () => {
      const result = numeric(0, 2)
      if (result.ok) return
      expect(isError(result.error)).toBe(true)
      expect(result.error.name).toBe('InvalidPrecisionScale')
      expect(result.error.args.precision).toBe(0)
      expect(result.error.args.scale).toBe(2)
    })

    it('decimal returns correct type with precision and scale', () => {
      const result = decimal(10, 2)
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'decimal', precision: 10, scale: 2 })
    })

    it('decimal returns error on invalid precision/scale', () => {
      expect(decimal(0, 2).ok).toBe(false)
      expect(decimal(2, 5).ok).toBe(false)
    })

    it('real returns correct type', () => {
      const result = real()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'real' })
    })
  })

  describe('character types', () => {
    it('text returns correct type', () => {
      const result = text()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'text' })
    })

    it('varchar returns correct type with length', () => {
      const result = varchar(255)
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'varchar', length: 255 })
    })

    it('varchar returns error on invalid length', () => {
      expect(varchar(0).ok).toBe(false)
      expect(varchar(-1).ok).toBe(false)
    })

    it('varchar error has correct name and args', () => {
      const result = varchar(0)
      if (result.ok) return
      expect(isError(result.error)).toBe(true)
      expect(result.error.name).toBe('InvalidLength')
      expect(result.error.args.length).toBe(0)
    })

    it('char returns correct type with length', () => {
      const result = char(10)
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'char', length: 10 })
    })

    it('char returns error on invalid length', () => {
      expect(char(0).ok).toBe(false)
    })
  })

  describe('boolean', () => {
    it('bool returns correct type', () => {
      const result = bool()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'boolean' })
    })
  })

  describe('date/time types', () => {
    it('date returns correct type', () => {
      const result = date()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'date' })
    })

    it('timestamp returns correct type', () => {
      const result = timestamp()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'timestamp' })
    })

    it('timestamptz returns correct type', () => {
      const result = timestamptz()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'timestamptz' })
    })
  })

  describe('json types', () => {
    it('json returns correct type', () => {
      const result = json()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'json' })
    })

    it('jsonb returns correct type', () => {
      const result = jsonb()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'jsonb' })
    })
  })

  describe('other types', () => {
    it('uuid returns correct type', () => {
      const result = uuid()
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'uuid' })
    })

    it('enum returns correct type with values', () => {
      const result = enum_(['draft', 'published', 'archived'])
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'enum', values: ['draft', 'published', 'archived'] })
    })

    it('enum returns error on empty array', () => {
      const result = enum_([])
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.name).toBe('InvalidEnumValues')
        expect(result.error.args.reason).toBe('empty')
      }
    })

    it('enum returns error on duplicate values', () => {
      const result = enum_(['a', 'a'])
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.name).toBe('InvalidEnumValues')
        expect(result.error.args.reason).toBe('duplicates')
      }
    })
  })

  describe('type discrimination', () => {
    it('ColumnType discriminated union works correctly', () => {
      const types: ColumnType[] = [
        serial().value,
        integer().value,
        numeric(10, 2).value,
        text().value,
        varchar(255).value,
        bool().value,
        date().value,
        json().value,
        uuid().value,
        enum_(['a', 'b']).value,
      ]

      expect(types[0].name).toBe('serial')
      expect(types[1].name).toBe('integer')
      expect(types[4].name).toBe('varchar')
      expect(types[7].name).toBe('json')
    })
  })
})
