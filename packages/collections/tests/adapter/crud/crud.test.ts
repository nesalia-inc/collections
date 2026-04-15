import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isNone, isOk, isSome } from '@deessejs/core'
import { create, findOne, findMany, update, remove, count, exists } from '../../../src/adapter/crud'

describe('CRUD operations', () => {
  // Mock Drizzle DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockDb: any = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  // Mock table with simple structure
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockTable: any = {
    name: 'posts',
    columns: {
      id: { type: 'uuid' },
      title: { type: 'varchar' },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('inserts data and returns created record', async () => {
      const mockRecord = { id: '123', title: 'Hello World' }
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockRecord]),
        }),
      })

      const result = await create(mockDb, mockTable, { title: 'Hello World' })

      expect(mockDb.insert).toHaveBeenCalledWith(mockTable)
      expect(isOk(result)).toBe(true)
      expect(result.value).toEqual(mockRecord)
    })

    it('calls beforeCreate hook', async () => {
      const beforeCreate = vi.fn().mockResolvedValue({ title: 'Modified Title' })
      const afterCreate = vi.fn()

      const mockRecord = { id: '123', title: 'Modified Title' }
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockRecord]),
        }),
      })

      await create(mockDb, mockTable, { title: 'Original' }, { hooks: { beforeCreate, afterCreate } })

      expect(beforeCreate).toHaveBeenCalledWith({ title: 'Original' })
    })

    it('calls afterCreate hook', async () => {
      const beforeCreate = vi.fn()
      const afterCreate = vi.fn()

      const mockRecord = { id: '123', title: 'Hello World' }
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockRecord]),
        }),
      })

      await create(mockDb, mockTable, { title: 'Hello World' }, { hooks: { beforeCreate, afterCreate } })

      expect(afterCreate).toHaveBeenCalledWith(mockRecord)
    })

    it('returns empty record when insert returns empty array', async () => {
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await create(mockDb, mockTable, { title: 'Hello' })

      expect(isOk(result)).toBe(false)
    })
  })

  describe('findOne', () => {
    it('returns record when found', async () => {
      const mockRecord = { id: '123', title: 'Hello World' }
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockRecord]),
          }),
        }),
      })

      const result = await findOne(mockDb, mockTable, '123')

      expect(isSome(result)).toBe(true)
      expect(result.value).toEqual(mockRecord)
    })

    it('returns null when not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await findOne(mockDb, mockTable, '123')

      expect(isNone(result)).toBe(true)
    })
  })

  describe('findMany', () => {
    it('returns all records when no options', async () => {
      const mockRecords = [
        { id: '1', title: 'First' },
        { id: '2', title: 'Second' },
      ]
      // Simple case: select().from(table) returns promise directly
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue(mockRecords),
      })

      const result = await findMany(mockDb, mockTable)

      expect(result).toEqual(mockRecords)
    })
  })

  describe('update', () => {
    it('updates record and returns updated data', async () => {
      const mockUpdatedRecord = { id: '123', title: 'Updated Title' }
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedRecord]),
          }),
        }),
      })

      const result = await update(mockDb, mockTable, '123', { title: 'Updated Title' })

      expect(mockDb.update).toHaveBeenCalledWith(mockTable)
      expect(isOk(result)).toBe(true)
      expect(result.value).toEqual(mockUpdatedRecord)
    })

    it('calls beforeUpdate hook', async () => {
      const beforeUpdate = vi.fn().mockResolvedValue({ title: 'Hook Modified' })

      const mockUpdatedRecord = { id: '123', title: 'Hook Modified' }
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedRecord]),
          }),
        }),
      })

      await update(mockDb, mockTable, '123', { title: 'Original' }, { hooks: { beforeUpdate } })

      expect(beforeUpdate).toHaveBeenCalledWith({ title: 'Original' })
    })

    it('calls afterUpdate hook', async () => {
      const afterUpdate = vi.fn()

      const mockUpdatedRecord = { id: '123', title: 'Updated' }
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockUpdatedRecord]),
          }),
        }),
      })

      await update(mockDb, mockTable, '123', { title: 'Updated' }, { hooks: { afterUpdate } })

      expect(afterUpdate).toHaveBeenCalledWith(mockUpdatedRecord)
    })
  })

  describe('remove', () => {
    it('deletes record and returns deleted data', async () => {
      const mockRecord = { id: '123', title: 'To Delete' }

      // Mock findOne to return the record
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockRecord]),
          }),
        }),
      })

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      })

      const result = await remove(mockDb, mockTable, '123')

      expect(mockDb.delete).toHaveBeenCalled()
      expect(isOk(result)).toBe(true)
      expect(result.value).toEqual(mockRecord)
    })

    it('returns error when record not found', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await remove(mockDb, mockTable, '123')

      expect(result.ok).toBe(false)
      expect(result.error.message).toContain('RecordNotFound')
    })

    it('calls beforeDelete hook', async () => {
      const beforeDelete = vi.fn()
      const mockRecord = { id: '123', title: 'To Delete' }

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockRecord]),
          }),
        }),
      })

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      })

      await remove(mockDb, mockTable, '123', { hooks: { beforeDelete } })

      expect(beforeDelete).toHaveBeenCalledWith(mockRecord)
    })

    it('calls afterDelete hook', async () => {
      const afterDelete = vi.fn()
      const mockRecord = { id: '123', title: 'To Delete' }

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockRecord]),
          }),
        }),
      })

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      })

      await remove(mockDb, mockTable, '123', { hooks: { afterDelete } })

      expect(afterDelete).toHaveBeenCalledWith(mockRecord)
    })
  })

  describe('count', () => {
    it('returns count of all records', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 42 }]),
      })

      const result = await count(mockDb, mockTable)

      expect(result).toBe(42)
    })

    it('returns 0 when no records', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: null }]),
      })

      const result = await count(mockDb, mockTable)

      expect(result).toBe(0)
    })
  })

  describe('exists', () => {
    it('returns true when record exists', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: '123' }]),
          }),
        }),
      })

      const result = await exists(mockDb, mockTable, {})

      expect(result).toBe(true)
    })

    it('returns false when record does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await exists(mockDb, mockTable, {})

      expect(result).toBe(false)
    })
  })
})