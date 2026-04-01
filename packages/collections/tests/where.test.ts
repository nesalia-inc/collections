import { describe, it, expect } from 'vitest'
import { where, and, or, not, eq, ne, gt, gte, lt, lte, between, inList, notInList, isNull, isNotNull, like, contains, startsWith, endsWith, regex, has, hasAny, overlaps, search } from '../src/operations/where'

describe('operations/where', () => {
  describe('where', () => {
    it('should create a predicate with single condition', () => {
      const predicate = where<{ name: string; age: number }>(p => [eq(p.name, 'John')])
      expect(predicate._tag).toBe('Predicate')
      expect(predicate.ast._tag).toBe('Eq')
      expect((predicate.ast as { field: string }).field).toBe('name')
      expect((predicate.ast as { value: unknown }).value).toBe('John')
    })

    it('should create AND node for multiple conditions', () => {
      const predicate = where<{ name: string; age: number }>(p => [
        eq(p.name, 'John'),
        gt(p.age, 18),
      ])
      expect(predicate.ast._tag).toBe('And')
      const andNode = predicate.ast as { nodes: { _tag: string }[] }
      expect(andNode.nodes.length).toBe(2)
    })

    it('should return single node when only one condition', () => {
      const predicate = where<{ name: string }>(p => [eq(p.name, 'John')])
      expect(predicate.ast._tag).toBe('Eq')
    })

    it('should handle nested paths', () => {
      const predicate = where<{ author: { name: string } }>(p => [
        eq(p.author.name, 'Jane'),
      ])
      expect(predicate.ast._tag).toBe('Eq')
      expect((predicate.ast as { field: string }).field).toBe('author.name')
    })
  })

  describe('operators', () => {
    describe('eq', () => {
      it('should create Eq node', () => {
        const node = eq<{ name: string }>({} as any, 'John')
        expect(node._tag).toBe('Eq')
        expect(node.value).toBe('John')
      })

      it('should accept null value', () => {
        const node = eq({} as any, null)
        expect(node.value).toBe(null)
      })
    })

    describe('ne', () => {
      it('should create Ne node', () => {
        const node = ne({} as any, 'John')
        expect(node._tag).toBe('Ne')
        expect(node.value).toBe('John')
      })
    })

    describe('gt', () => {
      it('should create Gt node', () => {
        const node = gt({} as any, 18)
        expect(node._tag).toBe('Gt')
        expect(node.value).toBe(18)
      })
    })

    describe('gte', () => {
      it('should create Gte node', () => {
        const node = gte({} as any, 18)
        expect(node._tag).toBe('Gte')
        expect(node.value).toBe(18)
      })
    })

    describe('lt', () => {
      it('should create Lt node', () => {
        const node = lt({} as any, 65)
        expect(node._tag).toBe('Lt')
        expect(node.value).toBe(65)
      })
    })

    describe('lte', () => {
      it('should create Lte node', () => {
        const node = lte({} as any, 65)
        expect(node._tag).toBe('Lte')
        expect(node.value).toBe(65)
      })
    })

    describe('between', () => {
      it('should create Between node', () => {
        const node = between({} as any, 10, 100)
        expect(node._tag).toBe('Between')
        expect(node.value).toEqual([10, 100])
      })
    })

    describe('inList', () => {
      it('should create In node', () => {
        const node = inList({} as any, ['a', 'b', 'c'])
        expect(node._tag).toBe('In')
        expect(node.value).toEqual(['a', 'b', 'c'])
      })
    })

    describe('notInList', () => {
      it('should create NotIn node', () => {
        const node = notInList({} as any, ['a', 'b'])
        expect(node._tag).toBe('NotIn')
        expect(node.value).toEqual(['a', 'b'])
      })
    })

    describe('isNull', () => {
      it('should create IsNull node', () => {
        const node = isNull({} as any)
        expect(node._tag).toBe('IsNull')
      })
    })

    describe('isNotNull', () => {
      it('should create IsNotNull node', () => {
        const node = isNotNull({} as any)
        expect(node._tag).toBe('IsNotNull')
      })
    })

    describe('like', () => {
      it('should create Like node', () => {
        const node = like({} as any, '%hello%')
        expect(node._tag).toBe('Like')
        expect(node.value).toBe('%hello%')
      })
    })

    describe('contains', () => {
      it('should create Contains node', () => {
        const node = contains({} as any, 'hello')
        expect(node._tag).toBe('Contains')
        expect(node.value).toBe('hello')
      })
    })

    describe('startsWith', () => {
      it('should create StartsWith node', () => {
        const node = startsWith({} as any, 'Hello')
        expect(node._tag).toBe('StartsWith')
        expect(node.value).toBe('Hello')
      })
    })

    describe('endsWith', () => {
      it('should create EndsWith node', () => {
        const node = endsWith({} as any, 'World')
        expect(node._tag).toBe('EndsWith')
        expect(node.value).toBe('World')
      })
    })

    describe('regex', () => {
      it('should create Regex node', () => {
        const node = regex({} as any, '^[a-z]+$')
        expect(node._tag).toBe('Regex')
        expect(node.value).toBe('^[a-z]+$')
      })
    })

    describe('has', () => {
      it('should create Has node', () => {
        const node = has({} as any, 'typescript')
        expect(node._tag).toBe('Has')
        expect(node.value).toBe('typescript')
      })
    })

    describe('hasAny', () => {
      it('should create HasAny node', () => {
        const node = hasAny({} as any, ['js', 'ts'])
        expect(node._tag).toBe('HasAny')
        expect(node.value).toEqual(['js', 'ts'])
      })
    })

    describe('overlaps', () => {
      it('should create Overlaps node', () => {
        const node = overlaps({} as any, ['read', 'write'])
        expect(node._tag).toBe('Overlaps')
        expect(node.value).toEqual(['read', 'write'])
      })
    })

    describe('search', () => {
      it('should create Search node with fields', () => {
        const node = search(['title', 'content'], 'typescript')
        expect(node._tag).toBe('Search')
        expect((node as { fields: string[] }).fields).toEqual(['title', 'content'])
        expect((node as { value: string }).value).toBe('typescript')
      })
    })
  })

  describe('logical combinators', () => {
    describe('and', () => {
      it('should create And node from multiple nodes', () => {
        const node = and(
          { _tag: 'Predicate', _entity: {}, ast: { _tag: 'Eq', field: 'name', value: 'John' } } as any,
          { _tag: 'Eq', field: 'age', value: 18 }
        )
        expect(node._tag).toBe('And')
        expect(node.nodes.length).toBe(2)
      })

      it('should extract ast from predicate', () => {
        const predicate = where<{ name: string }>(p => [eq(p.name, 'John')])
        const node = and(predicate)
        expect(node._tag).toBe('And')
        expect(node.nodes.length).toBe(1)
      })
    })

    describe('or', () => {
      it('should create Or node from multiple nodes', () => {
        const node = or(
          { _tag: 'Eq', field: 'name', value: 'John' },
          { _tag: 'Eq', field: 'name', value: 'Jane' }
        )
        expect(node._tag).toBe('Or')
        expect(node.nodes.length).toBe(2)
      })
    })

    describe('not', () => {
      it('should create Not node', () => {
        const innerNode = { _tag: 'Eq', field: 'name', value: 'John' }
        const node = not(innerNode)
        expect(node._tag).toBe('Not')
        expect((node as { node: any }).node).toBe(innerNode)
      })
    })
  })
})
