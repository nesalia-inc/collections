import { describe, it, expect, vi } from 'vitest'
import { collection } from '../src/collection'
import { field } from '../src/field'
import { f } from '../src'
import { createCollectionOperations } from '../src/operations/collection-operations'

/**
 * Mock table schema for testing
 */
const mockTable = {
  id: { name: 'id' },
  name: { name: 'name' },
  email: { name: 'email' },
  active: { name: 'active' }
}

/**
 * Create a mock database query builder that properly handles chaining
 */
const createQueryBuilder = (baseReturn: unknown[], options: { limit?: number } = {}) => {
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
} = {}) => {
  const selectResult = overrides.selectReturn || []

  return {
    select: vi.fn(() => ({
      from: vi.fn(() => createQueryBuilder(selectResult))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => createQueryBuilder(overrides.insertReturn || []))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => createQueryBuilder(overrides.updateReturn || []))
      }))
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => createQueryBuilder(overrides.deleteReturn || []))
    }))
  }
}

describe('hooks execution', () => {
  describe('create operations', () => {
    it('executes hooks in correct order for create operation', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() }),
          email: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async () => { executionOrder.push('beforeOperation') }],
          beforeCreate: [async () => { executionOrder.push('beforeCreate') }],
          afterCreate: [async () => { executionOrder.push('afterCreate') }],
          afterOperation: [async () => { executionOrder.push('afterOperation') }]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [{ id: 1, name: 'John', email: 'john@example.com' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.create({
        data: { name: 'John', email: 'john@example.com' },
        returning: true
      })

      expect(executionOrder).toEqual([
        'beforeOperation',
        'beforeCreate',
        'afterCreate',
        'afterOperation'
      ])
    })

    it('passes correct context to beforeOperation hook on create', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.create({
        data: { name: 'John' }
      })

      expect(receivedContext).toEqual({
        collection: 'users',
        operation: 'create',
        data: { name: 'John' },
        where: undefined
      })
    })

    it('passes correct context to beforeCreate hook on create', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeCreate: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.create({
        data: { name: 'John' }
      })

      expect(receivedContext).toMatchObject({
        collection: 'users',
        operation: 'create',
        data: { name: 'John' }
      })
      expect(receivedContext.db).toBeDefined()
    })

    it('passes correct context to afterCreate hook on create', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          afterCreate: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.create({
        data: { name: 'John' },
        returning: true
      })

      expect(receivedContext).toMatchObject({
        collection: 'users',
        operation: 'create',
        data: { name: 'John' }
      })
      expect(receivedContext.result).toEqual({ id: 1, name: 'John' })
    })

    it('executes multiple hooks in order', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeCreate: [
            async () => { executionOrder.push('hook1') },
            async () => { executionOrder.push('hook2') },
            async () => { executionOrder.push('hook3') }
          ]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.create({
        data: { name: 'John' }
      })

      expect(executionOrder).toEqual(['hook1', 'hook2', 'hook3'])
    })

    it('supports synchronous hooks', async () => {
      let hookCalled = false

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeCreate: [() => { hookCalled = true }]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.create({
        data: { name: 'John' }
      })

      expect(hookCalled).toBe(true)
    })

    it('allows hooks to modify data before create', async () => {
      let capturedData: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() }),
          email: field({ fieldType: f.text() })
        },
        hooks: {
          beforeCreate: [async (context) => {
            context.data.email = 'modified@example.com'
            capturedData = context.data
          }]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [{ id: 1, name: 'John', email: 'modified@example.com' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.create({
        data: { name: 'John', email: 'original@example.com' }
      })

      expect(capturedData.email).toBe('modified@example.com')
    })
  })

  describe('update operations', () => {
    it('executes hooks in correct order for update operation', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async () => { executionOrder.push('beforeOperation') }],
          beforeUpdate: [async () => { executionOrder.push('beforeUpdate') }],
          afterUpdate: [async () => { executionOrder.push('afterUpdate') }],
          afterOperation: [async () => { executionOrder.push('afterOperation') }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'Old Name' }],
        updateReturn: [{ id: 1, name: 'New Name' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.update({
        where: { id: 1 },
        data: { name: 'New Name' },
        returning: true
      })

      expect(executionOrder).toEqual([
        'beforeOperation',
        'beforeUpdate',
        'afterUpdate',
        'afterOperation'
      ])
    })

    it('passes previousData to beforeUpdate hook', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeUpdate: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'Old Name' }],
        updateReturn: [{ id: 1, name: 'New Name' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.update({
        where: { id: 1 },
        data: { name: 'New Name' }
      })

      expect(receivedContext.previousData).toEqual({ id: 1, name: 'Old Name' })
    })

    it('passes previousData to afterUpdate hook', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          afterUpdate: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'Old Name' }],
        updateReturn: [{ id: 1, name: 'New Name' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.update({
        where: { id: 1 },
        data: { name: 'New Name' },
        returning: true
      })

      expect(receivedContext.previousData).toEqual({ id: 1, name: 'Old Name' })
    })

    it('passes correct context to beforeOperation hook on update', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'Old' }],
        updateReturn: [{ id: 1, name: 'New' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.update({
        where: { id: 1 },
        data: { name: 'New' }
      })

      expect(receivedContext).toEqual({
        collection: 'users',
        operation: 'update',
        data: { name: 'New' },
        where: { id: 1 }
      })
    })
  })

  describe('delete operations', () => {
    it('executes hooks in correct order for delete operation', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async () => { executionOrder.push('beforeOperation') }],
          beforeDelete: [async () => { executionOrder.push('beforeDelete') }],
          afterDelete: [async () => { executionOrder.push('afterDelete') }],
          afterOperation: [async () => { executionOrder.push('afterOperation') }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }],
        deleteReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.delete({
        where: { id: 1 },
        returning: true
      })

      expect(executionOrder).toEqual([
        'beforeOperation',
        'beforeDelete',
        'afterDelete',
        'afterOperation'
      ])
    })

    it('passes previousData to beforeDelete hook', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeDelete: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }],
        deleteReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.delete({
        where: { id: 1 }
      })

      expect(receivedContext.previousData).toEqual({ id: 1, name: 'John' })
    })

    it('passes previousData to afterDelete hook', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          afterDelete: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }],
        deleteReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.delete({
        where: { id: 1 },
        returning: true
      })

      expect(receivedContext.previousData).toEqual({ id: 1, name: 'John' })
    })

    it('passes correct context to beforeOperation hook on delete', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }],
        deleteReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.delete({
        where: { id: 1 }
      })

      expect(receivedContext).toEqual({
        collection: 'users',
        operation: 'delete',
        where: { id: 1 },
        data: undefined
      })
    })
  })

  describe('read operations', () => {
    it('executes hooks in correct order for findMany operation', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async () => { executionOrder.push('beforeOperation') }],
          beforeRead: [async () => { executionOrder.push('beforeRead') }],
          afterRead: [async () => { executionOrder.push('afterRead') }],
          afterOperation: [async () => { executionOrder.push('afterOperation') }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.findMany()

      expect(executionOrder).toEqual([
        'beforeOperation',
        'beforeRead',
        'afterRead',
        'afterOperation'
      ])
    })

    it('passes correct context to beforeOperation hook on read', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.findMany({
        where: { name: { contains: 'John' } }
      })

      expect(receivedContext).toEqual({
        collection: 'users',
        operation: 'read',
        where: { name: { contains: 'John' } }
      })
    })

    it('passes query to beforeRead hook', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeRead: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.findMany({
        where: { name: 'John' },
        limit: 10,
        offset: 5
      })

      expect(receivedContext.query).toMatchObject({
        where: { name: 'John' },
        limit: 10,
        offset: 5
      })
    })

    it('passes result to afterRead hook', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          afterRead: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      const result = await operations.findMany()

      expect(receivedContext.result).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ])
    })

    it('executes hooks for findUnique operation', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async () => { executionOrder.push('beforeOperation') }],
          beforeRead: [async () => { executionOrder.push('beforeRead') }],
          afterRead: [async () => { executionOrder.push('afterRead') }],
          afterOperation: [async () => { executionOrder.push('afterOperation') }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.findUnique({
        where: { id: 1 }
      })

      expect(executionOrder).toEqual([
        'beforeOperation',
        'beforeRead',
        'afterRead',
        'afterOperation'
      ])
    })

    it('executes hooks for findFirst operation', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async () => { executionOrder.push('beforeOperation') }],
          beforeRead: [async () => { executionOrder.push('beforeRead') }],
          afterRead: [async () => { executionOrder.push('afterRead') }],
          afterOperation: [async () => { executionOrder.push('afterOperation') }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.findFirst({
        where: { name: 'John' }
      })

      expect(executionOrder).toEqual([
        'beforeOperation',
        'beforeRead',
        'afterRead',
        'afterOperation'
      ])
    })

    it('executes hooks for count operation', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async () => { executionOrder.push('beforeOperation') }],
          beforeRead: [async () => { executionOrder.push('beforeRead') }],
          afterRead: [async () => { executionOrder.push('afterRead') }],
          afterOperation: [async () => { executionOrder.push('afterOperation') }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1 }, { id: 2 }, { id: 3 }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.count()

      expect(executionOrder).toEqual([
        'beforeOperation',
        'beforeRead',
        'afterRead',
        'afterOperation'
      ])
    })

    it('executes hooks for exists operation', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async () => { executionOrder.push('beforeOperation') }],
          beforeRead: [async () => { executionOrder.push('beforeRead') }],
          afterRead: [async () => { executionOrder.push('afterRead') }],
          afterOperation: [async () => { executionOrder.push('afterOperation') }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.exists({
        where: { id: 1 }
      })

      expect(executionOrder).toEqual([
        'beforeOperation',
        'beforeRead',
        'afterRead',
        'afterOperation'
      ])
    })
  })

  describe('createMany operations', () => {
    it('executes hooks for each item in createMany', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async (context) => { executionOrder.push(`beforeOperation-${context.data.name}`) }],
          beforeCreate: [async (context) => { executionOrder.push(`beforeCreate-${context.data.name}`) }],
          afterCreate: [async (context) => { executionOrder.push(`afterCreate-${context.data.name}`) }],
          afterOperation: [async (context) => { executionOrder.push(`afterOperation-${context.data.name}`) }]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.createMany({
        data: [
          { name: 'John' },
          { name: 'Jane' }
        ]
      })

      expect(executionOrder).toEqual([
        'beforeOperation-John',
        'beforeCreate-John',
        'beforeOperation-Jane',
        'beforeCreate-Jane',
        'afterCreate-John',
        'afterOperation-John',
        'afterCreate-Jane',
        'afterOperation-Jane'
      ])
    })
  })

  describe('updateMany operations', () => {
    it('executes hooks for each item in updateMany', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeUpdate: [async (context) => {
            executionOrder.push(`beforeUpdate-${context.previousData?.name}`)
          }],
          afterUpdate: [async (context) => {
            executionOrder.push(`afterUpdate-${context.previousData?.name}`)
          }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.updateMany({
        where: { active: true },
        data: { active: false }
      })

      expect(executionOrder).toEqual([
        'beforeUpdate-John',
        'beforeUpdate-Jane',
        'afterUpdate-John',
        'afterUpdate-Jane'
      ])
    })
  })

  describe('deleteMany operations', () => {
    it('executes hooks for each item in deleteMany', async () => {
      const executionOrder: string[] = []

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeDelete: [async (context) => {
            executionOrder.push(`beforeDelete-${context.previousData?.name}`)
          }],
          afterDelete: [async (context) => {
            executionOrder.push(`afterDelete-${context.previousData?.name}`)
          }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.deleteMany({
        where: { active: false }
      })

      expect(executionOrder).toEqual([
        'beforeDelete-John',
        'beforeDelete-Jane',
        'afterDelete-John',
        'afterDelete-Jane'
      ])
    })
  })

  describe('hooks without db', () => {
    it('returns placeholder operations when db is not provided', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeCreate: [async () => { throw new Error('Should not be called') }]
        }
      })

      const operations = createCollectionOperations(users, 'users', null, mockTable, users.hooks)

      const result = await operations.findMany()
      expect(result).toEqual([])

      const unique = await operations.findUnique({ where: { id: 1 } })
      expect(unique).toBeUndefined()

      const created = await operations.create({ data: { name: 'John' } })
      expect(created).toBeUndefined()

      const count = await operations.count()
      expect(count).toBe(0)

      const exists = await operations.exists({ where: { id: 1 } })
      expect(exists).toBe(false)
    })
  })

  describe('error handling in hooks', () => {
    it('throws error when beforeOperation hook throws', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeOperation: [async () => { throw new Error('Hook error') }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await expect(operations.findMany()).rejects.toThrow('Hook error')
    })

    it('throws error when beforeCreate hook throws', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          beforeCreate: [async () => { throw new Error('Create hook error') }]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await expect(operations.create({ data: { name: 'John' } })).rejects.toThrow('Create hook error')
    })

    it('throws error when afterOperation hook throws', async () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          afterOperation: [async () => { throw new Error('After hook error') }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await expect(operations.findMany()).rejects.toThrow('After hook error')
    })
  })

  describe('afterOperation hook context', () => {
    it('passes result to afterOperation hook on create', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          afterOperation: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        insertReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.create({
        data: { name: 'John' },
        returning: true
      })

      expect(receivedContext.result).toEqual({ id: 1, name: 'John' })
    })

    it('passes result to afterOperation hook on read', async () => {
      let receivedContext: any = null

      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        },
        hooks: {
          afterOperation: [async (context) => { receivedContext = context }]
        }
      })

      const mockDb = createMockDb({
        selectReturn: [{ id: 1, name: 'John' }]
      })

      const operations = createCollectionOperations(users, 'users', mockDb, mockTable, users.hooks)

      await operations.findMany()

      expect(receivedContext.result).toEqual([{ id: 1, name: 'John' }])
    })
  })
})
