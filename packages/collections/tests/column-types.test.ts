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
} from '../src/column-types'

describe('column-types', () => {
  describe('numeric types', () => {
    it('serial returns correct type', () => {
      const result = serial()
      expect(result).toEqual({ name: 'serial' })
    })

    it('integer returns correct type', () => {
      const result = integer()
      expect(result).toEqual({ name: 'integer' })
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
      expect(result).toEqual({ name: 'real' })
    })
  })

  describe('character types', () => {
    it('text returns correct type', () => {
      const result = text()
      expect(result).toEqual({ name: 'text' })
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
      expect(result).toEqual({ name: 'boolean' })
    })
  })

  describe('date/time types', () => {
    it('date returns correct type', () => {
      const result = date()
      expect(result).toEqual({ name: 'date' })
    })

    it('timestamp returns correct type', () => {
      const result = timestamp()
      expect(result).toEqual({ name: 'timestamp' })
    })

    it('timestamptz returns correct type', () => {
      const result = timestamptz()
      expect(result).toEqual({ name: 'timestamptz' })
    })
  })

  describe('json types', () => {
    it('json returns correct type', () => {
      const result = json()
      expect(result).toEqual({ name: 'json' })
    })

    it('jsonb returns correct type', () => {
      const result = jsonb()
      expect(result).toEqual({ name: 'jsonb' })
    })
  })

  describe('other types', () => {
    it('uuid returns correct type', () => {
      const result = uuid()
      expect(result).toEqual({ name: 'uuid' })
    })

    it('enum returns correct type with values', () => {
      const result = enum_(['draft', 'published', 'archived'])
      expect(result.ok).toBe(true)
      expect(result.value).toEqual({ name: 'enum', values: ['draft', 'published', 'archived'] })
    })

    it('enum returns error on empty array', () => {
      expect(enum_([]).ok).toBe(false)
    })

    it('enum returns error on duplicate values', () => {
      expect(enum_(['a', 'a']).ok).toBe(false)
    })
  })

  describe('type discrimination', () => {
    it('ColumnType discriminated union works correctly', () => {
      const types: ColumnType[] = [
        serial(),
        integer(),
        numeric(10, 2).value,
        text(),
        varchar(255).value,
        bool(),
        date(),
        json(),
        uuid(),
        enum_(['a', 'b']).value,
      ]

      expect(types[0].name).toBe('serial')
      expect(types[1].name).toBe('integer')
      expect(types[4].name).toBe('varchar')
      expect(types[7].name).toBe('json')
    })
  })
})
