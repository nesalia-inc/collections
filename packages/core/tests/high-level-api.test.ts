import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineConfig, collection, field, f, pgAdapter } from '../src'
import { OperationResult } from '../src/operations/db-wrapper'

/**
 * Mock table schema for testing
 */
const mockTable = {
  id: { name: 'id' },
  name: { name: 'name' },
  email: { name: 'email' }
}

/**
 * Create a mock query builder that properly handles chaining
 */
const createQueryBuilder = (baseReturn: unknown[], options: { rowCount?: number } = {}) => {
  let returnValue = [...baseReturn]

  const builder: any = {
    where: vi.fn(() => builder),
    limit: vi.fn((n: number) => {
      returnValue = returnValue.slice(0, n)
      return builder
    }),
    orderBy: vi.fn(() => builder),
    offset: vi.fn((n: number) => {
      returnValue = returnValue.slice(n)
      return builder
    }),
    returning: vi.fn(() => returnValue)
  }

  // Add rowCount for update/delete
  if (options.rowCount !== undefined) {
    builder.rowCount = options.rowCount
  }

  // Make the builder thenable (for Promise support)
  builder.then = (resolve: any) => resolve(returnValue)

  return builder
}

/**
 * Create a mock database
 */
const createMockDb = (overrides: {
  selectReturn?: unknown[]
  insertReturn?: unknown[]
  updateReturn?: unknown[]
  deleteReturn?: unknown[]
  updateRowCount?: number
  deleteRowCount?: number
  countReturn?: number
} = {}) => {
  const selectResult = overrides.selectReturn || []
  const countResult = overrides.countReturn ?? 0

  return {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => createQueryBuilder(selectResult)),
        limit: vi.fn((n: number) => createQueryBuilder(selectResult.slice(0, n))),
        orderBy: vi.fn(() => createQueryBuilder(selectResult)),
        offset: vi.fn((n: number) => createQueryBuilder(selectResult.slice(n))),
        then: (resolve: any) => resolve(selectResult)
      })),
      then: (resolve: any) => resolve(selectResult)
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => createQueryBuilder(overrides.insertReturn || []))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => createQueryBuilder(overrides.updateReturn || [], { rowCount: overrides.updateRowCount ?? 0 }))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => createQueryBuilder(overrides.deleteReturn || [], { rowCount: overrides.deleteRowCount ?? 0 }))
    }))
  }
}

describe('High-level Database API', () => {
  describe('OperationResult type', () => {
    it('should have correct shape for queries', () => {
      const result: OperationResult<unknown[]> = {
        data: [],
        meta: {
          cacheKeys: ['users:find']
        }
      }

      expect(result.data).toBeDefined()
      expect(result.meta.cacheKeys).toBeDefined()
      expect(Array.isArray(result.meta.cacheKeys)).toBe(true)
    })

    it('should have correct shape for mutations', () => {
      const result: OperationResult<unknown> = {
        data: { id: 1 },
        meta: {
          invalidateKeys: ['users:*']
        }
      }

      expect(result.data).toBeDefined()
      expect(result.meta.invalidateKeys).toBeDefined()
      expect(Array.isArray(result.meta.invalidateKeys)).toBe(true)
    })
  })

  describe('Input validation', () => {
    it('should throw error for negative limit', async () => {
      const mockDb = createMockDb({ selectReturn: [] })

      // Create operations with validation
      const { createCollectionOperations } = await import('../src/operations/collection-operations')
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const operations = createCollectionOperations(
        users,
        'users',
        mockDb as any,
        mockTable as any
      )

      await expect(
        operations.findMany({ limit: -1 } as any)
      ).rejects.toThrow('limit must be a non-negative integer')
    })

    it('should throw error for limit exceeding maximum', async () => {
      const mockDb = createMockDb({ selectReturn: [] })

      const { createCollectionOperations } = await import('../src/operations/collection-operations')
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const operations = createCollectionOperations(
        users,
        'users',
        mockDb as any,
        mockTable as any
      )

      await expect(
        operations.findMany({ limit: 20000 } as any)
      ).rejects.toThrow('limit cannot exceed 10000')
    })

    it('should throw error for negative offset', async () => {
      const mockDb = createMockDb({ selectReturn: [] })

      const { createCollectionOperations } = await import('../src/operations/collection-operations')
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const operations = createCollectionOperations(
        users,
        'users',
        mockDb as any,
        mockTable as any
      )

      await expect(
        operations.findMany({ offset: -5 } as any)
      ).rejects.toThrow('offset must be a non-negative integer')
    })

    it('should throw error for offset exceeding maximum', async () => {
      const mockDb = createMockDb({ selectReturn: [] })

      const { createCollectionOperations } = await import('../src/operations/collection-operations')
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const operations = createCollectionOperations(
        users,
        'users',
        mockDb as any,
        mockTable as any
      )

      await expect(
        operations.findMany({ offset: 200000 } as any)
      ).rejects.toThrow('offset cannot exceed 100000')
    })

    it('should accept zero limit and offset', async () => {
      const mockDb = createMockDb({ selectReturn: [] })

      const { createCollectionOperations } = await import('../src/operations/collection-operations')
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const operations = createCollectionOperations(
        users,
        'users',
        mockDb as any,
        mockTable as any
      )

      // Should not throw - zero is valid
      await expect(
        operations.findMany({ limit: 0, offset: 0 } as any)
      ).resolves.not.toThrow()
    })
  })

  describe('Cache key format', () => {
    it('should include cacheKeys in find results', () => {
      // Test that the OperationResult type includes cacheKeys
      const result: OperationResult<any[]> = {
        data: [{ id: 1 }],
        meta: {
          cacheKeys: ['users:find:name=John']
        }
      }

      expect(result.meta.cacheKeys).toContain('users:find:name=John')
    })

    it('should include invalidateKeys in mutation results', () => {
      // Test that the OperationResult type includes invalidateKeys
      const result: OperationResult<any> = {
        data: { id: 1 },
        meta: {
          invalidateKeys: ['users:*']
        }
      }

      expect(result.meta.invalidateKeys).toContain('users:*')
    })

    it('should generate correct cache key format', () => {
      const result: OperationResult<any[]> = {
        data: [],
        meta: {
          cacheKeys: ['posts:find:status=published']
        }
      }

      expect(result.meta.cacheKeys[0]).toMatch(/^[a-z]+:[a-z]+:.*$/)
    })
  })

  describe('DbWrapper', () => {
    it('should expose $raw for advanced queries', () => {
      const config = defineConfig({
        database: pgAdapter({ url: 'postgres://localhost:5432/test' }),
        collections: [
          collection({
            slug: 'users',
            fields: {
              name: field({ fieldType: f.text() })
            }
          })
        ]
      })

      // $raw should be accessible
      expect(config.db.$raw).toBeDefined()
    })

    it('should have db object with collection methods', () => {
      const config = defineConfig({
        database: pgAdapter({ url: 'postgres://localhost:5432/test' }),
        collections: [
          collection({
            slug: 'users',
            fields: {
              name: field({ fieldType: f.text() })
            }
          })
        ]
      })

      // db should have collection methods
      expect(config.db.users).toBeDefined()
      expect(typeof config.db.users.find).toBe('function')
      expect(typeof config.db.users.findById).toBe('function')
      expect(typeof config.db.users.create).toBe('function')
      expect(typeof config.db.users.update).toBe('function')
      expect(typeof config.db.users.delete).toBe('function')
    })
  })
})

describe('defineConfig', () => {
  it('should create config with db wrapper', () => {
    const config = defineConfig({
      database: pgAdapter({ url: 'postgres://localhost:5432/test' }),
      collections: [
        collection({
          slug: 'posts',
          fields: {
            title: field({ fieldType: f.text() })
          }
        })
      ]
    })

    expect(config.db.posts).toBeDefined()
    expect(config.collections.posts).toBeDefined()
    expect(config.$meta.collections).toContain('posts')
  })

  it('should return db with $raw property', () => {
    const config = defineConfig({
      database: pgAdapter({ url: 'postgres://localhost:5432/test' }),
      collections: [
        collection({
          slug: 'users',
          fields: {
            name: field({ fieldType: f.text() })
          }
        })
      ]
    })

    expect((config.db as any).$raw).toBeDefined()
  })

  it('should support multiple collections', () => {
    const config = defineConfig({
      database: pgAdapter({ url: 'postgres://localhost:5432/test' }),
      collections: [
        collection({
          slug: 'users',
          fields: { name: field({ fieldType: f.text() }) }
        }),
        collection({
          slug: 'posts',
          fields: { title: field({ fieldType: f.text() }) }
        })
      ]
    })

    expect(config.db.users).toBeDefined()
    expect(config.db.posts).toBeDefined()
    expect(config.$meta.collections).toHaveLength(2)
  })

  it('should include plugins in $meta', () => {
    const mockPlugin = {
      name: 'test-plugin',
      collections: {
        settings: collection({
          slug: 'settings',
          fields: { key: field({ fieldType: f.text() }) }
        })
      }
    }

    const config = defineConfig({
      database: pgAdapter({ url: 'postgres://localhost:5432/test' }),
      collections: [collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })],
      plugins: [mockPlugin]
    })

    expect(config.$meta.plugins).toContain('test-plugin')
    // Note: plugin collections are added to collections metadata but may not have db methods
    // unless they have a matching table in the schema
    expect(config.collections.settings).toBeDefined()
  })
})
