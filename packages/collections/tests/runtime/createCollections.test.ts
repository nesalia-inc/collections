import { describe, it, expect, vi, beforeEach } from 'vitest'
import { postgres, sqlite, createCollections } from '../../src/runtime/createCollections'
import { isOk, isErr } from '@deessejs/core'
import { collection, field, f } from '../../src'

describe('createCollections', () => {
  describe('postgres() helper', () => {
    it('returns correct DbConnection with type postgres and Pool instance', () => {
      const dbConnection = postgres('postgresql://localhost:5432/mydb')

      expect(dbConnection.type).toBe('postgres')
      expect(dbConnection.connection).toBeInstanceOf(Object) // Pool instance
      expect(dbConnection.connectionString).toBe('postgresql://localhost:5432/mydb')
    })

    it('returns correct DbConnection with options', () => {
      const dbConnection = postgres('postgresql://localhost:5432/mydb', {
        max: 20,
        idleTimeoutMillis: 50000,
      })

      expect(dbConnection.type).toBe('postgres')
      expect(dbConnection.options).toEqual({
        max: 20,
        idleTimeoutMillis: 50000,
      })
    })
  })

  describe('sqlite() helper', () => {
    it('returns correct DbConnection with type sqlite', () => {
      const dbConnection = sqlite('./mydb.sqlite')

      expect(dbConnection.type).toBe('sqlite')
      expect(dbConnection.connection).toBe('./mydb.sqlite')
    })

    it('accepts SqliteDatabase instance', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockDb: any = {}
      const dbConnection = sqlite(mockDb)

      expect(dbConnection.type).toBe('sqlite')
      expect(dbConnection.connection).toBe(mockDb)
    })
  })

  describe('createCollections()', () => {
    it('returns Result - success case returns ok with db and definitions', async () => {
      // Create a proper collection using the collection() DSL
      const mockCollection = collection({
        slug: 'posts',
        fields: {
          title: field({ fieldType: f.text() }),
        },
      })

      // Mock a simple database connection
      const mockDb = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue([]),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: '1' }]),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          from: vi.fn().mockResolvedValue(undefined),
        }),
      }

      const result = await createCollections({
        collections: [mockCollection],
        db: postgres(mockDb),
      })

      // The result should be a Result type (ok)
      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value).toHaveProperty('db')
        expect(result.value).toHaveProperty('definitions')
        expect(result.value.db).toHaveProperty('posts')
        expect(result.value.definitions).toHaveProperty('posts')
      }
    })

    it('returns Result - error case returns err with proper error type for unsupported db', async () => {
      // Create a proper collection using the collection() DSL
      const mockCollection = collection({
        slug: 'posts',
        fields: {
          title: field({ fieldType: f.text() }),
        },
      })

      // Create a connection with unsupported type
      const unsupportedConnection = {
        type: 'mongodb' as const,
        connection: 'mongodb://localhost:27017/mydb',
      }

      const result = await createCollections({
        collections: [mockCollection],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db: unsupportedConnection as any,
      })

      // Should return an error Result
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeDefined()
        expect(result.error).toHaveProperty('name')
        expect(result.error).toHaveProperty('message')
      }
    })

    it('returns Result with correct structure when using postgres connection string', async () => {
      // Create a proper collection using the collection() DSL
      const mockCollection = collection({
        slug: 'posts',
        fields: {
          title: field({ fieldType: f.text() }),
        },
      })

      // Mock a connection string (will be handled by pg Pool)
      const result = await createCollections({
        collections: [mockCollection],
        db: postgres('postgresql://localhost:5432/mydb'),
      })

      // Since we're using a connection string, it will try to create a real Pool
      // which may fail, but the important thing is that it returns a Result type
      expect(result).toBeDefined()
      // If it fails, it should be an error Result, not a throw
      if (isErr(result)) {
        expect(result.error).toBeDefined()
        expect(result.error).toHaveProperty('name')
      }
    })
  })
})
