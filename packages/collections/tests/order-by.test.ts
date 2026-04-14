import { describe, it, expect } from 'vitest'
import { orderBy, asc, desc } from '../src/operations/order-by'

describe('operations/order-by', () => {
  describe('orderBy', () => {
    it('should create OrderBy with single asc node', () => {
      const ordering = orderBy<{ name: string }>(p => [asc(p.name)])
      expect(ordering._tag).toBe('OrderBy')
      expect(ordering.ast.length).toBe(1)
      expect(ordering.ast[0]._tag).toBe('OrderNode')
      expect(ordering.ast[0].field).toBe('name')
      expect(ordering.ast[0].direction).toBe('asc')
    })

    it('should create OrderBy with single desc node', () => {
      const ordering = orderBy<{ createdAt: Date }>(p => [desc(p.createdAt)])
      expect(ordering.ast[0].field).toBe('createdAt')
      expect(ordering.ast[0].direction).toBe('desc')
    })

    it('should create OrderBy with multiple nodes', () => {
      const ordering = orderBy<{ status: string; createdAt: Date }>(p => [
        asc(p.status),
        desc(p.createdAt),
      ])
      expect(ordering.ast.length).toBe(2)
      expect(ordering.ast[0].field).toBe('status')
      expect(ordering.ast[0].direction).toBe('asc')
      expect(ordering.ast[1].field).toBe('createdAt')
      expect(ordering.ast[1].direction).toBe('desc')
    })

    it('should handle nested paths', () => {
      const ordering = orderBy<{ author: { name: string } }>(p => [
        asc(p.author.name),
      ])
      expect(ordering.ast[0].field).toBe('author.name')
    })

    it('should throw if result is not an OrderNode', () => {
      expect(() => {
        orderBy<{ name: string }>(p => p.name as any)
      }).toThrow('orderBy: expected OrderNode from asc() or desc()')
    })

    it('should throw if array contains non-OrderNode', () => {
      expect(() => {
        orderBy<{ name: string; age: number }>(p => [asc(p.name), p.age as any])
      }).toThrow('orderBy: expected OrderNode from asc() or desc()')
    })

    it('should handle single non-array result', () => {
      const ordering = orderBy<{ name: string }>(p => asc(p.name))
      expect(ordering.ast.length).toBe(1)
      expect(ordering.ast[0].field).toBe('name')
    })
  })

  describe('asc', () => {
    it('should create OrderNode with asc direction', () => {
      const node = asc<{ name: string }>({} as any)
      expect(node._tag).toBe('OrderNode')
      expect(node.direction).toBe('asc')
    })
  })

  describe('desc', () => {
    it('should create OrderNode with desc direction', () => {
      const node = desc<{ name: string }>({} as any)
      expect(node._tag).toBe('OrderNode')
      expect(node.direction).toBe('desc')
    })
  })
})
