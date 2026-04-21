import { describe, it, expect, beforeEach } from 'vitest'

import { predicateToSql } from '../../../src/operations/database/sqlBuilder'
import type { Predicate, WhereNode } from '../../../src/operations/where/types'

// Helper to create a Predicate wrapper
function createPredicate<T>(ast: WhereNode): Predicate<T> {
  return { _tag: 'Predicate', _entity: {} as T, ast }
}

// Helper to create a mock Drizzle table with columns
function createMockTable(fields: Record<string, unknown>): Record<string, unknown> {
  return {
    columns: fields,
    ...fields,
  }
}

describe('sqlBuilder - predicateToSql', () => {
  let mockTable: Record<string, unknown>

  beforeEach(() => {
    mockTable = createMockTable({
      id: 'mock.id',
      title: 'mock.title',
      published: 'mock.published',
      authorId: 'mock.authorId',
      age: 'mock.age',
      email: 'mock.email',
      status: 'mock.status',
      tags: 'mock.tags',
      createdAt: 'mock.createdAt',
    })
  })

  describe('comparison operators', () => {
    it('should build eq SQL expression', () => {
      const predicate = createPredicate({ _tag: 'Eq', field: 'title', value: 'Hello' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
      expect(result).toBeInstanceOf(Object)
    })

    it('should build ne SQL expression', () => {
      const predicate = createPredicate({ _tag: 'Ne', field: 'title', value: 'Hello' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build gt SQL expression', () => {
      const predicate = createPredicate({ _tag: 'Gt', field: 'age', value: 18 })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build gte SQL expression', () => {
      const predicate = createPredicate({ _tag: 'Gte', field: 'age', value: 18 })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build lt SQL expression', () => {
      const predicate = createPredicate({ _tag: 'Lt', field: 'age', value: 65 })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build lte SQL expression', () => {
      const predicate = createPredicate({ _tag: 'Lte', field: 'age', value: 65 })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })
  })

  describe('logical combinators', () => {
    it('should build And SQL expression with multiple conditions', () => {
      const predicate = createPredicate({
        _tag: 'And',
        nodes: [
          { _tag: 'Eq', field: 'title', value: 'Hello' },
          { _tag: 'Gt', field: 'age', value: 18 },
        ],
      })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build Or SQL expression with multiple conditions', () => {
      const predicate = createPredicate({
        _tag: 'Or',
        nodes: [
          { _tag: 'Eq', field: 'title', value: 'Hello' },
          { _tag: 'Eq', field: 'title', value: 'World' },
        ],
      })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build Not SQL expression', () => {
      const predicate = createPredicate({
        _tag: 'Not',
        node: { _tag: 'Eq', field: 'title', value: 'Hello' },
      })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })
  })

  describe('between, inList, notInList', () => {
    it('should build between SQL expression as and(gte, lte)', () => {
      const predicate = createPredicate({ _tag: 'Between', field: 'age', value: [18, 65] })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build inList SQL expression', () => {
      const predicate = createPredicate({ _tag: 'In', field: 'status', value: ['active', 'pending'] })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build notInList SQL expression', () => {
      const predicate = createPredicate({ _tag: 'NotIn', field: 'status', value: ['active', 'pending'] })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })
  })

  describe('isNull, isNotNull', () => {
    it('should build isNull SQL expression', () => {
      const predicate = createPredicate({ _tag: 'IsNull', field: 'title' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build isNotNull SQL expression', () => {
      const predicate = createPredicate({ _tag: 'IsNotNull', field: 'title' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })
  })

  describe('like operators', () => {
    it('should build like SQL expression', () => {
      const predicate = createPredicate({ _tag: 'Like', field: 'title', value: '%Hello%' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build contains SQL expression with wildcards', () => {
      const predicate = createPredicate({ _tag: 'Contains', field: 'title', value: 'Hello' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build startsWith SQL expression with suffix wildcard', () => {
      const predicate = createPredicate({ _tag: 'StartsWith', field: 'title', value: 'Hello' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should build endsWith SQL expression with prefix wildcard', () => {
      const predicate = createPredicate({ _tag: 'EndsWith', field: 'title', value: 'Hello' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })
  })

  describe('nested paths', () => {
    it('should resolve nested field path', () => {
      const nestedTable = createMockTable({
        author: {
          name: 'mock.author.name',
          email: 'mock.author.email',
        },
        title: 'mock.title',
      })
      const predicate = createPredicate({ _tag: 'Eq', field: 'author.name', value: 'John' })
      const result = predicateToSql(predicate, nestedTable)
      expect(result).toBeDefined()
    })

    it('should resolve deeply nested field path', () => {
      const deeplyNestedTable = {
        columns: {
          author: {
            columns: {
              profile: {
                columns: {
                  name: 'mock.author.profile.name',
                },
              },
            },
          },
        },
      }
      const predicate = createPredicate({ _tag: 'Eq', field: 'author.profile.name', value: 'John' })
      const result = predicateToSql(predicate, deeplyNestedTable)
      expect(result).toBeDefined()
    })
  })

  describe('invalid field paths', () => {
    it('should return undefined for non-existent field path', () => {
      const predicate = createPredicate({ _tag: 'Eq', field: 'nonexistent', value: 'Hello' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeUndefined()
    })

    it('should return undefined for partially valid nested path', () => {
      const nestedTable = createMockTable({
        author: {
          name: 'mock.author.name',
        },
      })
      const predicate = createPredicate({ _tag: 'Eq', field: 'author.nonexistent', value: 'John' })
      const result = predicateToSql(predicate, nestedTable)
      expect(result).toBeUndefined()
    })

    it('should return undefined for completely invalid nested path', () => {
      const predicate = createPredicate({ _tag: 'Eq', field: 'foo.bar.baz', value: 'value' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeUndefined()
    })

    it('should return undefined for empty field name', () => {
      const predicate = createPredicate({ _tag: 'Eq', field: '', value: 'Hello' })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('should return undefined when predicate is null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = predicateToSql(null as any, mockTable)
      expect(result).toBeUndefined()
    })

    it('should return undefined when predicate has no ast', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = predicateToSql({} as any, mockTable)
      expect(result).toBeUndefined()
    })

    it('should handle nested logical operators', () => {
      const predicate = createPredicate({
        _tag: 'And',
        nodes: [
          {
            _tag: 'Or',
            nodes: [
              { _tag: 'Eq', field: 'title', value: 'Hello' },
              { _tag: 'Eq', field: 'title', value: 'World' },
            ],
          },
          { _tag: 'Gt', field: 'age', value: 18 },
        ],
      })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })

    it('should return undefined when all nodes in And are invalid', () => {
      const predicate = createPredicate({
        _tag: 'And',
        nodes: [
          { _tag: 'Eq', field: 'nonexistent1', value: 'Hello' },
          { _tag: 'Eq', field: 'nonexistent2', value: 'World' },
        ],
      })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeUndefined()
    })

    it('should handle mix of valid and invalid nodes in Or', () => {
      const predicate = createPredicate({
        _tag: 'Or',
        nodes: [
          { _tag: 'Eq', field: 'title', value: 'Hello' },
          { _tag: 'Eq', field: 'nonexistent', value: 'World' },
        ],
      })
      const result = predicateToSql(predicate, mockTable)
      expect(result).toBeDefined()
    })
  })
})
