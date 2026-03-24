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
      expect(result).toEqual({ name: 'numeric', precision: 10, scale: 2 })
    })

    it('numeric throws on invalid precision/scale', () => {
      expect(() => numeric(0, 2)).toThrow('Invalid precision/scale')
      expect(() => numeric(2, 5)).toThrow('Invalid precision/scale')
      expect(() => numeric(-1, 0)).toThrow('Invalid precision/scale')
    })

    it('decimal returns correct type with precision and scale', () => {
      const result = decimal(10, 2)
      expect(result).toEqual({ name: 'decimal', precision: 10, scale: 2 })
    })

    it('decimal throws on invalid precision/scale', () => {
      expect(() => decimal(0, 2)).toThrow('Invalid precision/scale')
      expect(() => decimal(2, 5)).toThrow('Invalid precision/scale')
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
      expect(result).toEqual({ name: 'varchar', length: 255 })
    })

    it('varchar throws on invalid length', () => {
      expect(() => varchar(0)).toThrow('Invalid length')
      expect(() => varchar(-1)).toThrow('Invalid length')
    })

    it('char returns correct type with length', () => {
      const result = char(10)
      expect(result).toEqual({ name: 'char', length: 10 })
    })

    it('char throws on invalid length', () => {
      expect(() => char(0)).toThrow('Invalid length')
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
      expect(result).toEqual({ name: 'enum', values: ['draft', 'published', 'archived'] })
    })

    it('enum throws on empty array', () => {
      expect(() => enum_([])).toThrow('Invalid values: array must not be empty')
    })

    it('enum throws on duplicate values', () => {
      expect(() => enum_(['a', 'a'])).toThrow('Invalid values: array must not contain duplicates')
    })
  })

  describe('type discrimination', () => {
    it('ColumnType discriminated union works correctly', () => {
      const types: ColumnType[] = [
        serial(),
        integer(),
        numeric(10, 2),
        text(),
        varchar(255),
        bool(),
        date(),
        json(),
        uuid(),
        enum_(['a', 'b']),
      ]

      expect(types[0].name).toBe('serial')
      expect(types[1].name).toBe('integer')
      expect(types[4].name).toBe('varchar')
      expect(types[7].name).toBe('json')
    })
  })
})
