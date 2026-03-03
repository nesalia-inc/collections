import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { collection } from '../../src/collection'
import { field } from '../../src/field'
import { f } from '../../src'
import { buildTable } from '../../src/schema'
import { createCollectionOperations } from '../../src/operations/collection-operations'

// Skip all tests if no DATABASE_URL is provided
const dbUrl = process.env.DATABASE_URL
const itIfDb = dbUrl ? it : it.skip

describe('hooks integration with real database', () => {
  let pool: any
  let db: any

  const testTableName = `test_users_${Date.now()}`

  beforeAll(async () => {
    if (!dbUrl) {
      console.log('DATABASE_URL not set, skipping integration tests')
      return
    }

    try {
      // Use pg Pool for PostgreSQL
      pool = new Pool({ connectionString: dbUrl })
      db = drizzle(pool)

      // Create test table
      await pool.query(`
        CREATE TABLE ${testTableName} (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `)

      console.log(`Table ${testTableName} created`)
    } catch (error) {
      console.error('Failed to setup test table:', error)
      throw error
    }
  }, 60000)

  afterAll(async () => {
    if (pool) {
      try {
        await pool.query(`DROP TABLE IF EXISTS ${testTableName}`)
        await pool.end()
      } catch (error) {
        console.error('Failed to cleanup test table:', error)
      }
    }
  }, 60000)

  itIfDb('executes hooks in correct order for create', async () => {
    const executionOrder: string[] = []

    const users = collection({
      slug: testTableName,
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

    const table = buildTable(users)
    const operations = createCollectionOperations(users, testTableName, db, table, users.hooks)

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

  itIfDb('passes correct context to create hooks', async () => {
    let receivedContext: any = null

    const users = collection({
      slug: testTableName,
      fields: {
        name: field({ fieldType: f.text() })
      },
      hooks: {
        beforeCreate: [async (context) => { receivedContext = context }]
      }
    })

    const table = buildTable(users)
    const operations = createCollectionOperations(users, testTableName, db, table, users.hooks)

    await operations.create({
      data: { name: 'Jane' }
    })

    expect(receivedContext.collection).toBe(testTableName)
    expect(receivedContext.operation).toBe('create')
    expect(receivedContext.data.name).toBe('Jane')
    expect(receivedContext.db).toBeDefined()
  })

  itIfDb('hooks can modify data before create', async () => {
    const users = collection({
      slug: testTableName,
      fields: {
        name: field({ fieldType: f.text() }),
        email: field({ fieldType: f.text() })
      },
      hooks: {
        beforeCreate: [async (context) => {
          context.data.email = 'modified@example.com'
        }]
      }
    })

    const table = buildTable(users)
    const operations = createCollectionOperations(users, testTableName, db, table, users.hooks)

    const result = await operations.create({
      data: { name: 'Test', email: 'original@example.com' },
      returning: true
    })

    expect(result?.email).toBe('modified@example.com')
  })

  itIfDb('executes hooks in correct order for update', async () => {
    const executionOrder: string[] = []

    const users = collection({
      slug: testTableName,
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

    const table = buildTable(users)
    const operations = createCollectionOperations(users, testTableName, db, table, users.hooks)

    const created = await operations.create({
      data: { name: 'Original' },
      returning: true
    })

    executionOrder.length = 0

    await operations.update({
      where: { id: created?.id },
      data: { name: 'Updated' }
    })

    expect(executionOrder).toEqual([
      'beforeOperation',
      'beforeUpdate',
      'afterUpdate',
      'afterOperation'
    ])
  })

  itIfDb('passes previousData to update hooks', async () => {
    let previousData: any = null

    const users = collection({
      slug: testTableName,
      fields: {
        name: field({ fieldType: f.text() })
      },
      hooks: {
        beforeUpdate: [async (context) => { previousData = context.previousData }]
      }
    })

    const table = buildTable(users)
    const operations = createCollectionOperations(users, testTableName, db, table, users.hooks)

    const created = await operations.create({
      data: { name: 'Original' },
      returning: true
    })

    await operations.update({
      where: { id: created?.id },
      data: { name: 'Updated' }
    })

    expect(previousData?.name).toBe('Original')
  })

  itIfDb('executes hooks in correct order for delete', async () => {
    const executionOrder: string[] = []

    const users = collection({
      slug: testTableName,
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

    const table = buildTable(users)
    const operations = createCollectionOperations(users, testTableName, db, table, users.hooks)

    const created = await operations.create({
      data: { name: 'ToDelete' },
      returning: true
    })

    executionOrder.length = 0

    await operations.delete({
      where: { id: created?.id }
    })

    expect(executionOrder).toEqual([
      'beforeOperation',
      'beforeDelete',
      'afterDelete',
      'afterOperation'
    ])
  })

  itIfDb('executes hooks for read operations', async () => {
    const executionOrder: string[] = []

    const users = collection({
      slug: testTableName,
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

    const table = buildTable(users)
    const operations = createCollectionOperations(users, testTableName, db, table, users.hooks)

    await operations.findMany()

    expect(executionOrder).toEqual([
      'beforeOperation',
      'beforeRead',
      'afterRead',
      'afterOperation'
    ])
  })

  itIfDb('throws error when beforeOperation hook throws', async () => {
    const users = collection({
      slug: testTableName,
      fields: {
        name: field({ fieldType: f.text() })
      },
      hooks: {
        beforeOperation: [async () => { throw new Error('Hook error') }]
      }
    })

    const table = buildTable(users)
    const operations = createCollectionOperations(users, testTableName, db, table, users.hooks)

    await expect(operations.findMany()).rejects.toThrow('Hook error')
  })

  itIfDb('createMany executes hooks for each item', async () => {
    const executionOrder: string[] = []

    const users = collection({
      slug: testTableName,
      fields: {
        name: field({ fieldType: f.text() })
      },
      hooks: {
        beforeCreate: [async (context) => {
          executionOrder.push(`before-${context.data.name}`)
        }],
        afterCreate: [async (context) => {
          executionOrder.push(`after-${context.data.name}`)
        }]
      }
    })

    const table = buildTable(users)
    const operations = createCollectionOperations(users, testTableName, db, table, users.hooks)

    await operations.createMany({
      data: [
        { name: 'Alice' },
        { name: 'Bob' }
      ]
    })

    expect(executionOrder).toContain('before-Alice')
    expect(executionOrder).toContain('before-Bob')
    expect(executionOrder).toContain('after-Alice')
    expect(executionOrder).toContain('after-Bob')
  })
})
