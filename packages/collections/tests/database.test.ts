import { describe, it, expect } from 'vitest'
import type {
  DbAccess,
  CollectionDbMethods,
  FindManyQuery,
  WhereById,
  CreateOperation,
  CreateManyOperation,
  CreateError,
  Counted,
} from '../src/operations/database/types'

describe('database/types', () => {
  describe('FindManyQuery', () => {
    it('should accept partial where', () => {
      const query: FindManyQuery<{ name: string; age: number }> = {
        where: { name: 'John' },
      }
      expect(query.where?.name).toBe('John')
    })

    it('should accept orderBy', () => {
      const query: FindManyQuery<{ name: string }> = {
        orderBy: 'name',
      }
      expect(query.orderBy).toBe('name')
    })

    it('should accept limit and offset', () => {
      const query: FindManyQuery<{ name: string }> = {
        limit: 10,
        offset: 5,
      }
      expect(query.limit).toBe(10)
      expect(query.offset).toBe(5)
    })
  })

  describe('WhereById', () => {
    it('should accept id string', () => {
      const where: WhereById = { id: '123' }
      expect(where.id).toBe('123')
    })
  })

  describe('CreateOperation', () => {
    it('should accept partial data', () => {
      const op: CreateOperation<{ name: string; age: number }> = {
        data: { name: 'John' },
      }
      expect(op.data.name).toBe('John')
    })
  })

  describe('CreateManyOperation', () => {
    it('should accept array of partial data', () => {
      const op: CreateManyOperation<{ name: string }> = {
        data: [{ name: 'John' }, { name: 'Jane' }],
      }
      expect(op.data.length).toBe(2)
    })
  })

  describe('CreateError', () => {
    it('should accept ALREADY_EXISTS error', () => {
      const error: CreateError = {
        code: 'ALREADY_EXISTS',
        message: 'Record already exists',
      }
      expect(error.code).toBe('ALREADY_EXISTS')
    })

    it('should accept INCOMPLETE_DATA error with fields', () => {
      const error: CreateError = {
        code: 'INCOMPLETE_DATA',
        message: 'Missing required fields',
        fields: ['name', 'email'],
      }
      expect(error.fields).toEqual(['name', 'email'])
    })

    it('should accept UNKNOWN error', () => {
      const error: CreateError = {
        code: 'UNKNOWN',
        message: 'Something went wrong',
      }
      expect(error.code).toBe('UNKNOWN')
    })
  })

  describe('Counted', () => {
    it('should add count to result', () => {
      const result: Counted<{ id: number }[]> = [
        { id: 1 },
        { id: 2 },
        { id: 3 },
        { count: 3 } as any,
      ]
      expect(result[3].count).toBe(3)
    })
  })
})
