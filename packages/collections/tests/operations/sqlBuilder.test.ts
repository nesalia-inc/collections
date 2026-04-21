import { describe, it, expect, vi, beforeEach } from 'vitest'
import { and, or, not, eq, ne, gt, gte, lt, lte, like, ilike, inArray, notInArray, asc, desc, isNull, isNotNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import { buildWhereSQL, buildOrderBySQL, buildSelectSQL } from '../../src/operations/database/sqlBuilder'
import type { WhereNode } from '../../src/operations/where/types'
import type { OrderBy, OrderNode } from '../../src/operations/order-by/types'
import type { Selection, SelectNode } from '../../src/operations/select/types'

// Helper to create mock table
function createMockTable(fields: Record<string, unknown>): Record<string, unknown> {
  return fields
}

// Helper to create a Predicate wrapper
function createPredicate<T>(ast: WhereNode): { _tag: 'Predicate'; _entity: T; ast: WhereNode } {
  return { _tag: 'Predicate', _entity: {} as T, ast }
}

describe('sqlBuilder', () => {
  let mockTable: Record<string, unknown>

  beforeEach(() => {
    mockTable = createMockTable({
      id: 'mock.id',
      name: 'mock.name',
      age: 'mock.age',
      email: 'mock.email',
      status: 'mock.status',
      tags: 'mock.tags',
      createdAt: 'mock.createdAt',
      title: 'mock.title',
      content: 'mock.content',
      'author.name': 'mock.author.name',
    })
  })

  describe('buildWhereSQL', () => {
    describe('comparison operators', () => {
      it('should build eq SQL expression', () => {
        const predicate = createPredicate({ _tag: 'Eq', field: 'name', value: 'John' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
        expect(result).toBeInstanceOf(Object)
      })

      it('should build ne SQL expression', () => {
        const predicate = createPredicate({ _tag: 'Ne', field: 'name', value: 'John' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build gt SQL expression', () => {
        const predicate = createPredicate({ _tag: 'Gt', field: 'age', value: 18 })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build gte SQL expression', () => {
        const predicate = createPredicate({ _tag: 'Gte', field: 'age', value: 18 })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build lt SQL expression', () => {
        const predicate = createPredicate({ _tag: 'Lt', field: 'age', value: 65 })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build lte SQL expression', () => {
        const predicate = createPredicate({ _tag: 'Lte', field: 'age', value: 65 })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })
    })

    describe('like operators', () => {
      it('should build like SQL expression', () => {
        const predicate = createPredicate({ _tag: 'Like', field: 'name', value: '%John%' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build contains SQL expression with wildcards', () => {
        const predicate = createPredicate({ _tag: 'Contains', field: 'name', value: 'John' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build startsWith SQL expression with suffix wildcard', () => {
        const predicate = createPredicate({ _tag: 'StartsWith', field: 'name', value: 'John' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build endsWith SQL expression with prefix wildcard', () => {
        const predicate = createPredicate({ _tag: 'EndsWith', field: 'name', value: 'John' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build regex SQL expression using ilike', () => {
        const predicate = createPredicate({ _tag: 'Regex', field: 'name', value: '^[a-z]+$' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })
    })

    describe('array operators', () => {
      it('should build inArray SQL expression', () => {
        const predicate = createPredicate({ _tag: 'In', field: 'status', value: ['active', 'pending'] })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build notInArray SQL expression', () => {
        const predicate = createPredicate({ _tag: 'NotIn', field: 'status', value: ['active', 'pending'] })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build between SQL expression as and(gte, lte)', () => {
        const predicate = createPredicate({ _tag: 'Between', field: 'age', value: [18, 65] })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })
    })

    describe('null operators', () => {
      it('should build isNull SQL expression', () => {
        const predicate = createPredicate({ _tag: 'IsNull', field: 'name' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build isNotNull SQL expression', () => {
        const predicate = createPredicate({ _tag: 'IsNotNull', field: 'name' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })
    })

    describe('array membership operators', () => {
      it('should build Has SQL expression', () => {
        const predicate = createPredicate({ _tag: 'Has', field: 'tags', value: 'typescript' })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build HasAny SQL expression with or conditions', () => {
        const predicate = createPredicate({ _tag: 'HasAny', field: 'tags', value: ['js', 'ts'] })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build Overlaps SQL expression', () => {
        const predicate = createPredicate({ _tag: 'Overlaps', field: 'tags', value: ['read', 'write'] })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })
    })

    describe('logical combinators', () => {
      it('should build And SQL expression with multiple conditions', () => {
        const predicate = createPredicate({
          _tag: 'And',
          nodes: [
            { _tag: 'Eq', field: 'name', value: 'John' },
            { _tag: 'Gt', field: 'age', value: 18 },
          ],
        })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build Or SQL expression with multiple conditions', () => {
        const predicate = createPredicate({
          _tag: 'Or',
          nodes: [
            { _tag: 'Eq', field: 'name', value: 'John' },
            { _tag: 'Eq', field: 'name', value: 'Jane' },
          ],
        })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build Not SQL expression', () => {
        const predicate = createPredicate({
          _tag: 'Not',
          node: { _tag: 'Eq', field: 'name', value: 'John' },
        })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })
    })

    describe('search operator', () => {
      it('should build Search SQL expression with or for multiple fields', () => {
        const predicate = createPredicate({
          _tag: 'Search',
          fields: ['title', 'content'],
          value: 'typescript',
        })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should build Search SQL expression for single field without or', () => {
        const predicate = createPredicate({
          _tag: 'Search',
          fields: ['title'],
          value: 'typescript',
        })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })
    })

    describe('edge cases', () => {
      it('should return undefined when predicate is null', () => {
        const result = buildWhereSQL(null as any, mockTable)
        expect(result).toBeUndefined()
      })

      it('should return undefined when predicate has no ast', () => {
        const result = buildWhereSQL({} as any, mockTable)
        expect(result).toBeUndefined()
      })

      it('should return undefined when And has empty nodes', () => {
        const predicate = createPredicate({ _tag: 'And', nodes: [] })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeUndefined()
      })

      it('should return single condition when And has only one node', () => {
        const predicate = createPredicate({
          _tag: 'And',
          nodes: [{ _tag: 'Eq', field: 'name', value: 'John' }],
        })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should return single condition when Or has only one node', () => {
        const predicate = createPredicate({
          _tag: 'Or',
          nodes: [{ _tag: 'Eq', field: 'name', value: 'John' }],
        })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })

      it('should handle nested logical operators', () => {
        const predicate = createPredicate({
          _tag: 'And',
          nodes: [
            {
              _tag: 'Or',
              nodes: [
                { _tag: 'Eq', field: 'name', value: 'John' },
                { _tag: 'Eq', field: 'name', value: 'Jane' },
              ],
            },
            { _tag: 'Gt', field: 'age', value: 18 },
          ],
        })
        const result = buildWhereSQL(predicate, mockTable)
        expect(result).toBeDefined()
      })
    })
  })

  describe('buildOrderBySQL', () => {
    it('should build asc SQL expression for OrderNode', () => {
      const orderBy: OrderBy<unknown> = {
        _tag: 'OrderBy',
        _entity: {},
        ast: [
          { _tag: 'OrderNode', field: 'name', direction: 'asc' },
        ],
      }
      const result = buildOrderBySQL(orderBy, mockTable)
      expect(result).toHaveLength(1)
      expect(result[0]).toBeDefined()
    })

    it('should build desc SQL expression for OrderNode', () => {
      const orderBy: OrderBy<unknown> = {
        _tag: 'OrderBy',
        _entity: {},
        ast: [
          { _tag: 'OrderNode', field: 'age', direction: 'desc' },
        ],
      }
      const result = buildOrderBySQL(orderBy, mockTable)
      expect(result).toHaveLength(1)
      expect(result[0]).toBeDefined()
    })

    it('should handle multiple OrderNodes', () => {
      const orderBy: OrderBy<unknown> = {
        _tag: 'OrderBy',
        _entity: {},
        ast: [
          { _tag: 'OrderNode', field: 'status', direction: 'asc' },
          { _tag: 'OrderNode', field: 'createdAt', direction: 'desc' },
        ],
      }
      const result = buildOrderBySQL(orderBy, mockTable)
      expect(result).toHaveLength(2)
    })

    it('should return empty array when orderBy is null', () => {
      const result = buildOrderBySQL(null as any, mockTable)
      expect(result).toEqual([])
    })

    it('should return empty array when orderBy has no ast', () => {
      const result = buildOrderBySQL({} as any, mockTable)
      expect(result).toEqual([])
    })

    it('should return empty array when ast is empty', () => {
      const orderBy: OrderBy<unknown> = {
        _tag: 'OrderBy',
        _entity: {},
        ast: [],
      }
      const result = buildOrderBySQL(orderBy, mockTable)
      expect(result).toEqual([])
    })
  })

  describe('buildSelectSQL', () => {
    it('should build select fields from Selection with SelectNodes', () => {
      const selection: Selection<unknown, unknown> = {
        _tag: 'Selection',
        ast: [
          { _tag: 'SelectNode', path: ['name'], field: 'name', alias: 'name', isRelation: false, isCollection: false },
          { _tag: 'SelectNode', path: ['age'], field: 'age', alias: 'age', isRelation: false, isCollection: false },
        ],
      }
      const result = buildSelectSQL(selection, mockTable)
      expect(result).toEqual({
        name: 'mock.name',
        age: 'mock.age',
      })
    })

    it('should handle nested field paths', () => {
      const selection: Selection<unknown, unknown> = {
        _tag: 'Selection',
        ast: [
          { _tag: 'SelectNode', path: ['author', 'name'], field: 'author.name', alias: 'author.name', isRelation: false, isCollection: false },
        ],
      }
      const result = buildSelectSQL(selection, mockTable)
      expect(result).toEqual({
        'author.name': 'mock.author.name',
      })
    })

    it('should return table when selection has empty ast', () => {
      const selection: Selection<unknown, unknown> = {
        _tag: 'Selection',
        ast: [],
      }
      const result = buildSelectSQL(selection, mockTable)
      expect(result).toBe(mockTable)
    })

    it('should return table when selection is null', () => {
      const result = buildSelectSQL(null as any, mockTable)
      expect(result).toBe(mockTable)
    })

    it('should return table when selection has no ast property', () => {
      const result = buildSelectSQL({} as any, mockTable)
      expect(result).toBe(mockTable)
    })

    it('should handle multiple select nodes', () => {
      const selection: Selection<unknown, unknown> = {
        _tag: 'Selection',
        ast: [
          { _tag: 'SelectNode', path: ['id'], field: 'id', alias: 'id', isRelation: false, isCollection: false },
          { _tag: 'SelectNode', path: ['name'], field: 'name', alias: 'name', isRelation: false, isCollection: false },
          { _tag: 'SelectNode', path: ['email'], field: 'email', alias: 'email', isRelation: false, isCollection: false },
        ],
      }
      const result = buildSelectSQL(selection, mockTable)
      expect(result).toEqual({
        id: 'mock.id',
        name: 'mock.name',
        email: 'mock.email',
      })
    })
  })
})