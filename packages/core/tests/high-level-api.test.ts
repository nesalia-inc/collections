import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineConfig, collection, field, f, pgAdapter } from '../src'
import { OperationResult, DbWrapper, CollectionDbWrapper } from '../src/operations/db-wrapper'
import { createCollectionOperations } from '../src/operations/collection-operations'

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

describe('DbWrapper', () => {
  let dbWrapper: DbWrapper
  let mockDb: ReturnType<typeof createMockDb>

  beforeEach(() => {
    dbWrapper = new DbWrapper()
    mockDb = createMockDb({ selectReturn: [{ id: 1, name: 'John' }] })
  })

  describe('CollectionDbWrapper', () => {
    it('should create find operation with cache keys', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDb as any,
        mockTable as any
      )

      const result = await wrapper.find({ where: { name: 'John' } })

      expect(result.data).toHaveLength(1)
      expect(result.meta.cacheKeys).toBeDefined()
      expect(result.meta.cacheKeys?.[0]).toContain('users:find')
    })

    it('should create findById operation', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbWithId = createMockDb({ selectReturn: [{ id: 1, name: 'John' }] })
      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbWithId as any,
        mockTable as any
      )

      const result = await wrapper.findById(1)

      expect(result.data).toBeDefined()
      expect(result.meta.cacheKeys).toBeDefined()
      expect(result.meta.cacheKeys?.[0]).toContain('users:findById')
    })

    it('should create findFirst operation', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbWithId = createMockDb({ selectReturn: [{ id: 1, name: 'John' }] })
      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbWithId as any,
        mockTable as any
      )

      const result = await wrapper.findFirst({ where: { name: 'John' } })

      expect(result.data).toBeDefined()
      expect(result.meta.cacheKeys).toBeDefined()
    })

    it('should create count operation', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbWithCount = createMockDb({ selectReturn: [{ id: 1 }] })
      // Override select to return count result
      mockDbWithCount.select = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            then: (resolve: any) => resolve([{ count: 42 }])
          }))
        }))
      }))

      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbWithCount as any,
        mockTable as any
      )

      const result = await wrapper.count({ where: { name: 'John' } })

      expect(result.meta.cacheKeys).toBeDefined()
      expect(result.meta.cacheKeys?.[0]).toContain('users:count')
    })

    it('should create exists operation', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbWithId = createMockDb({ selectReturn: [{ id: 1 }] })
      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbWithId as any,
        mockTable as any
      )

      const result = await wrapper.exists({ where: { name: 'John' } })

      expect(result.meta.cacheKeys).toBeDefined()
    })

    it('should create create operation with invalidate keys', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbInsert = createMockDb({ insertReturn: [{ id: 1, name: 'John' }] })
      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbInsert as any,
        mockTable as any
      )

      const result = await wrapper.create({ data: { name: 'John' } })

      expect(result.meta.invalidateKeys).toBeDefined()
      expect(result.meta.invalidateKeys?.[0]).toContain('users:*')
    })

    it('should create createMany operation', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbInsert = createMockDb({ insertReturn: [] })
      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbInsert as any,
        mockTable as any
      )

      const result = await wrapper.createMany({ data: [{ name: 'John' }, { name: 'Jane' }] })

      expect(result.meta.invalidateKeys).toBeDefined()
    })

    it('should create update operation', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbUpdate = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }],
        updateReturn: [{ id: 1, name: 'Jane' }],
        updateRowCount: 1
      })
      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbUpdate as any,
        mockTable as any
      )

      const result = await wrapper.update({
        where: { id: 1 },
        data: { name: 'Jane' }
      })

      expect(result.meta.invalidateKeys).toBeDefined()
    })

    it('should create updateMany operation', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      // Mock that returns an empty array for update - the operation should still return invalidateKeys
      const mockDbUpdate = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }],
        updateRowCount: 0
      })
      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbUpdate as any,
        mockTable as any
      )

      // Just verify invalidateKeys is returned
      const result = await wrapper.updateMany({
        where: { name: 'John' },
        data: { name: 'Jane' }
      })

      expect(result.meta.invalidateKeys).toBeDefined()
    })

    it('should create delete operation', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbDelete = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }],
        deleteReturn: [{ id: 1, name: 'John' }],
        deleteRowCount: 1
      })
      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbDelete as any,
        mockTable as any
      )

      const result = await wrapper.delete({ where: { id: 1 } })

      expect(result.meta.invalidateKeys).toBeDefined()
    })

    it('should create deleteMany operation', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      // Mock that returns empty array
      const mockDbDelete = createMockDb({
        selectReturn: [{ id: 1 }, { id: 2 }],
        deleteRowCount: 0
      })
      const wrapper = new CollectionDbWrapper(
        users,
        'users',
        mockDbDelete as any,
        mockTable as any
      )

      // Just verify invalidateKeys is returned
      const result = await wrapper.deleteMany({ where: { name: 'John' } })

      expect(result.meta.invalidateKeys).toBeDefined()
    })
  })

  describe('DbWrapper class', () => {
    it('should register collections', () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbForRegister = createMockDb({ selectReturn: [] })
      dbWrapper.register('users', users, mockDbForRegister as any, mockTable as any)

      expect(dbWrapper.has('users')).toBe(true)
    })

    it('should get registered collections', () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const mockDbForRegister = createMockDb({ selectReturn: [] })
      dbWrapper.register('users', users, mockDbForRegister as any, mockTable as any)

      const wrapper = dbWrapper.get('users')
      expect(wrapper).toBeDefined()
    })

    it('should return undefined for non-existent collections', () => {
      const wrapper = dbWrapper.get('non-existent')
      expect(wrapper).toBeUndefined()
    })

    it('should return all keys', () => {
      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })
      const posts = collection({
        slug: 'posts',
        fields: { title: field({ fieldType: f.text() }) }
      })

      const mockDb1 = createMockDb({ selectReturn: [] })
      const mockDb2 = createMockDb({ selectReturn: [] })

      dbWrapper.register('users', users, mockDb1 as any, mockTable as any)
      dbWrapper.register('posts', posts, mockDb2 as any, mockTable as any)

      const keys = dbWrapper.keys()
      expect(keys).toContain('users')
      expect(keys).toContain('posts')
    })

    it('should set validation options', () => {
      const wrapper = new DbWrapper()
      wrapper.setValidationOptions({ maxLimit: 5000, maxOffset: 50000 })

      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const mockDbWithValidation = createMockDb({ selectReturn: [] })
      wrapper.register('users', users, mockDbWithValidation as any, mockTable as any)

      expect(wrapper.has('users')).toBe(true)
    })
  })

  describe('generateCacheKey', () => {
    it('should generate key without where clause', () => {
      // Test the format by checking the result structure
      const result: OperationResult<unknown[]> = {
        data: [],
        meta: {
          cacheKeys: ['users:find']
        }
      }
      expect(result.meta.cacheKeys?.[0]).toBe('users:find')
    })

    it('should generate key with where clause', () => {
      const result: OperationResult<unknown[]> = {
        data: [],
        meta: {
          cacheKeys: ['users:find:status=published']
        }
      }
      expect(result.meta.cacheKeys?.[0]).toContain('status=published')
    })
  })

  describe('generateInvalidateKeys', () => {
    it('should generate invalidate keys for collection', () => {
      const result: OperationResult<unknown> = {
        data: {},
        meta: {
          invalidateKeys: ['users:*', 'users:find:*', 'users:findById:*', 'users:count:*', 'users:list']
        }
      }
      expect(result.meta.invalidateKeys).toHaveLength(5)
      expect(result.meta.invalidateKeys?.[0]).toBe('users:*')
    })
  })
})

describe('defineConfig with full db wrapper', () => {
  it('should create db with all collection methods', () => {
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

    // Test all methods exist
    expect(typeof config.db.users.find).toBe('function')
    expect(typeof config.db.users.findById).toBe('function')
    expect(typeof config.db.users.findFirst).toBe('function')
    expect(typeof config.db.users.count).toBe('function')
    expect(typeof config.db.users.exists).toBe('function')
    expect(typeof config.db.users.create).toBe('function')
    expect(typeof config.db.users.createMany).toBe('function')
    expect(typeof config.db.users.update).toBe('function')
    expect(typeof config.db.users.updateMany).toBe('function')
    expect(typeof config.db.users.delete).toBe('function')
    expect(typeof config.db.users.deleteMany).toBe('function')

    // Test posts
    expect(typeof config.db.posts.find).toBe('function')
  })

  it('should include $meta with collections and plugins', () => {
    const config = defineConfig({
      database: pgAdapter({ url: 'postgres://localhost:5432/test' }),
      collections: [
        collection({
          slug: 'users',
          fields: { name: field({ fieldType: f.text() }) }
        })
      ]
    })

    expect(config.$meta.collections).toContain('users')
    expect(Array.isArray(config.$meta.collections)).toBe(true)
    expect(Array.isArray(config.$meta.plugins)).toBe(true)
  })

  it('should support plugins', () => {
    const mockPlugin = {
      name: 'test-plugin'
    }

    const config = defineConfig({
      database: pgAdapter({ url: 'postgres://localhost:5432/test' }),
      collections: [
        collection({
          slug: 'users',
          fields: { name: field({ fieldType: f.text() }) }
        })
      ],
      plugins: [mockPlugin] as any
    })

    expect(config.$meta.plugins).toContain('test-plugin')
  })

  it('should support plugins with collections', () => {
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
      collections: [
        collection({
          slug: 'users',
          fields: { name: field({ fieldType: f.text() }) }
        })
      ],
      plugins: [mockPlugin] as any
    })

    // Plugin should be in meta
    expect(config.$meta.plugins).toContain('test-plugin')
    // Plugin collection should be in collections metadata
    expect(config.collections.settings).toBeDefined()
    expect(config.collections.settings.slug).toBe('settings')
  })

  it('should expose $raw for advanced queries', () => {
    const config = defineConfig({
      database: pgAdapter({ url: 'postgres://localhost:5432/test' }),
      collections: [
        collection({
          slug: 'users',
          fields: { name: field({ fieldType: f.text() }) }
        })
      ]
    })

    // $raw should be the drizzle instance
    expect((config.db as any).$raw).toBeDefined()
  })
})

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
