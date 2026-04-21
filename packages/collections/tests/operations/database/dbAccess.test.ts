import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isOk, isErr } from '@deessejs/core'
import { createDbAccess } from '../../../src/operations/database/dbAccess'
import { where, eq } from '../../../src/operations/where'

describe('dbAccess', () => {
  // Mock Drizzle DB
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockDb: any = {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }

  // Mock table with Drizzle-like structure (has columns property)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockTable: any = {
    columns: {
      id: { type: 'uuid' },
      title: { type: 'varchar' },
      content: { type: 'text' },
    },
    id: { type: 'uuid' },
    title: { type: 'varchar' },
    content: { type: 'text' },
  }

  // Mock drizzle schema containing the table
  const mockDrizzleSchema = {
    posts: mockTable,
  }

  // Mock raw schema - provide a minimal RawTable for 'posts'
  const mockRawSchema = new Map([
    ['posts', {
      name: 'posts',
      columns: {
        id: { type: 'uuid' as const, name: 'id', primaryKey: true },
        title: { type: 'varchar' as const, name: 'title', length: 255 },
        content: { type: 'text' as const, name: 'content' },
      },
    }],
  ])

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createDbAccess factory', () => {
    it('creates dbAccess with correct structure', () => {
      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)

      expect(dbAccess).toHaveProperty('posts')
      expect(dbAccess.posts).toHaveProperty('findMany')
      expect(dbAccess.posts).toHaveProperty('find')
      expect(dbAccess.posts).toHaveProperty('findUnique')
      expect(dbAccess.posts).toHaveProperty('findFirst')
      expect(dbAccess.posts).toHaveProperty('create')
      expect(dbAccess.posts).toHaveProperty('createMany')
      expect(dbAccess.posts).toHaveProperty('update')
      expect(dbAccess.posts).toHaveProperty('delete')
      expect(dbAccess.posts).toHaveProperty('count')
      expect(dbAccess.posts).toHaveProperty('exists')
    })
  })

  describe('findMany', () => {
    it('returns all records when no query provided', async () => {
      const mockRecords = [
        { id: '1', title: 'First', content: 'Content 1' },
        { id: '2', title: 'Second', content: 'Content 2' },
      ]

      // For findMany without options, it calls: db.select().from(table)
      // which directly returns the promise
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue(mockRecords),
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.findMany()

      expect(result).toEqual(mockRecords)
      expect(mockDb.select).toHaveBeenCalled()
    })

    it('applies limit and offset', async () => {
      const mockRecords = [{ id: '1', title: 'First' }]

      // Build the chain: select().from().limit().offset()
      const offsetFn = vi.fn().mockResolvedValue(mockRecords)
      const limitFn = vi.fn().mockReturnValue({
        offset: offsetFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.findMany({ limit: 10, offset: 5 })

      expect(result).toEqual(mockRecords)
      expect(limitFn).toHaveBeenCalledWith(10)
      expect(offsetFn).toHaveBeenCalledWith(5)
    })
  })

  describe('find', () => {
    it('returns paginated results with offset pagination', async () => {
      const mockRecords = [
        { id: '1', title: 'First' },
        { id: '2', title: 'Second' },
      ]

      // Build the chain for findMany with limit and offset
      const offsetFn = vi.fn().mockResolvedValue(mockRecords)
      const limitFn = vi.fn().mockReturnValue({
        offset: offsetFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const pagination = {
        _tag: 'OffsetPagination' as const,
        limit: 10,
        offset: 0,
      }

      const result = await dbAccess.posts.find({ pagination })

      expect(result.current.data).toEqual(mockRecords)
      expect(result.current.limit).toBe(10)
      expect(result.current.offset).toBe(0)
      expect(result.hasNext).toBe(false)
      expect(result.hasPrevious).toBe(false)
    })

    it('handles cursor pagination with hasNext', async () => {
      const mockRecords = Array(10).fill({ id: '1', title: 'Item' })

      const offsetFn = vi.fn().mockResolvedValue(mockRecords)
      const limitFn = vi.fn().mockReturnValue({
        offset: offsetFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const pagination = {
        _tag: 'CursorPagination' as const,
        limit: 10,
      }

      const result = await dbAccess.posts.find({ pagination })

      expect(result.hasNext).toBe(true)
    })

    it('next() returns null when hasNext is false', async () => {
      const mockRecords = [{ id: '1', title: 'Only' }]

      const offsetFn = vi.fn().mockResolvedValue(mockRecords)
      const limitFn = vi.fn().mockReturnValue({
        offset: offsetFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const pagination = {
        _tag: 'OffsetPagination' as const,
        limit: 10,
        offset: 0,
      }

      const result = await dbAccess.posts.find({ pagination })
      const nextPage = await result.next()

      expect(nextPage).toBeNull()
    })

    it('next() returns next page when hasNext is true', async () => {
      const mockRecords = Array(10).fill({ id: '1', title: 'Item' })

      const offsetFn = vi.fn().mockResolvedValue(mockRecords)
      const limitFn = vi.fn().mockReturnValue({
        offset: offsetFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const pagination = {
        _tag: 'OffsetPagination' as const,
        limit: 10,
        offset: 0,
      }

      const result = await dbAccess.posts.find({ pagination })
      const nextPage = await result.next()

      expect(nextPage).not.toBeNull()
    })

    it('previous() returns null when hasPrevious is false', async () => {
      const mockRecords = [{ id: '1', title: 'First' }]

      const offsetFn = vi.fn().mockResolvedValue(mockRecords)
      const limitFn = vi.fn().mockReturnValue({
        offset: offsetFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const pagination = {
        _tag: 'OffsetPagination' as const,
        limit: 10,
        offset: 0,
      }

      const result = await dbAccess.posts.find({ pagination })
      const prevPage = await result.previous()

      expect(prevPage).toBeNull()
    })

    it('previous() returns previous page when hasPrevious is true', async () => {
      const mockRecords = [{ id: '1', title: 'Item' }]

      let offsetValue = 10
      const offsetFn = vi.fn().mockImplementation(() => {
        if (offsetValue === 0) return mockRecords
        offsetValue = 0
        return mockRecords
      })
      const limitFn = vi.fn().mockReturnValue({
        offset: offsetFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const pagination = {
        _tag: 'OffsetPagination' as const,
        limit: 10,
        offset: 10,
      }

      const result = await dbAccess.posts.find({ pagination })
      const prevPage = await result.previous()

      expect(prevPage).not.toBeNull()
      expect(prevPage?.current.offset).toBe(0)
    })
  })

  describe('findUnique', () => {
    it('returns record when found by id', async () => {
      const mockRecord = { id: '123', title: 'Found' }

      const limitFn = vi.fn().mockResolvedValue([mockRecord])
      const whereFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.findUnique({ where: { id: '123' } })

      expect(result).toEqual(mockRecord)
    })

    it('returns null when not found', async () => {
      const limitFn = vi.fn().mockResolvedValue([])
      const whereFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.findUnique({ where: { id: 'not-found' } })

      expect(result).toBeNull()
    })
  })

  describe('findFirst', () => {
    it('returns first record matching query', async () => {
      const mockRecord = { id: '1', title: 'First' }

      const limitFn = vi.fn().mockResolvedValue([mockRecord])
      const fromFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.findFirst()

      expect(result).toEqual(mockRecord)
    })

    it('returns null when no records found', async () => {
      const limitFn = vi.fn().mockResolvedValue([])
      const fromFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.findFirst()

      expect(result).toBeNull()
    })
  })

  describe('createMany', () => {
    it('creates multiple records and returns Result with count', async () => {
      const insertedRecords = [
        { id: '1' },
        { id: '2' },
        { id: '3' },
      ]

      const returningFn = vi.fn().mockResolvedValue(insertedRecords)
      const valuesFn = vi.fn().mockReturnValue({
        returning: returningFn,
      })
      mockDb.insert.mockReturnValue({
        values: valuesFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.createMany({
        data: [
          { title: 'Post 1' },
          { title: 'Post 2' },
          { title: 'Post 3' },
        ],
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.count).toBe(3)
        expect(result.value.insertedIds).toEqual(['1', '2', '3'])
      }
    })

    it('returns count 0 for empty data array', async () => {
      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.createMany({ data: [] })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.count).toBe(0)
      }
      expect(mockDb.insert).not.toHaveBeenCalled()
    })

    it('returns error when database insert fails', async () => {
      const returningFn = vi.fn().mockRejectedValue(new Error('Database error'))
      const valuesFn = vi.fn().mockReturnValue({
        returning: returningFn,
      })
      mockDb.insert.mockReturnValue({
        values: valuesFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.createMany({
        data: [{ title: 'Post 1' }],
      })

      expect(isErr(result)).toBe(true)
    })
  })

  describe('update', () => {
    it('updates records matching predicate and returns Result', async () => {
      const mockUpdatedRecord = { id: '1', title: 'Updated Title' }

      // Mock the update chain - db.update(table).set(data).where(sql).returning()
      const returningFn = vi.fn().mockResolvedValue([mockUpdatedRecord])
      const whereFn = vi.fn().mockReturnValue({
        returning: returningFn,
      })
      const setFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.update.mockReturnValue({
        set: setFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      // Create a proper predicate using the where builder
      const predicate = where((p) => [eq(p.id, '1')])

      const result = await dbAccess.posts.update({
        where: predicate,
        data: { title: 'Updated Title' },
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.count).toBe(1)
        expect(result.value.records[0].title).toBe('Updated Title')
      }
    })

    it('returns error when no records match the predicate', async () => {
      // Mock the update chain that returns empty
      const returningFn = vi.fn().mockResolvedValue([])
      const whereFn = vi.fn().mockReturnValue({
        returning: returningFn,
      })
      const setFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.update.mockReturnValue({
        set: setFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const predicate = where((p) => [eq(p.id, 'non-existent')])

      const result = await dbAccess.posts.update({
        where: predicate,
        data: { title: 'Updated Title' },
      })

      expect(isErr(result)).toBe(true)
    })

    it('updates multiple records and returns correct count', async () => {
      const mockUpdatedRecords = [
        { id: '1', title: 'Updated 1' },
        { id: '2', title: 'Updated 2' },
        { id: '3', title: 'Updated 3' },
      ]

      // Mock the update chain returning multiple records
      const returningFn = vi.fn().mockResolvedValue(mockUpdatedRecords)
      const whereFn = vi.fn().mockReturnValue({
        returning: returningFn,
      })
      const setFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.update.mockReturnValue({
        set: setFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      // Use a valid field from the mock table (id, title, content)
      const predicate = where((p) => [eq(p.id, '1')])

      const result = await dbAccess.posts.update({
        where: predicate,
        data: { title: 'Updated' },
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.count).toBe(3)
        expect(result.value.records).toHaveLength(3)
        expect(result.value.records[0].title).toBe('Updated 1')
        expect(result.value.records[1].title).toBe('Updated 2')
        expect(result.value.records[2].title).toBe('Updated 3')
      }
    })

    it('returns error Result when predicate field does not exist in schema', async () => {
      // Mock the update chain
      const returningFn = vi.fn().mockResolvedValue([{ id: '1' }])
      const whereFn = vi.fn().mockReturnValue({
        returning: returningFn,
      })
      const setFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.update.mockReturnValue({
        set: setFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      // Use a field 'published' that does NOT exist in the mock table
      // This will cause predicateToSql to return undefined, triggering the error path
      const predicate = where((p) => [eq((p as any).published, true)])

      const result = await dbAccess.posts.update({
        where: predicate,
        data: { title: 'Updated' },
      })

      // When predicateToSql returns undefined for a non-existent field, we get an error
      expect(isErr(result)).toBe(true)
    })
  })

  describe('delete', () => {
    it('deletes records matching predicate and returns Result', async () => {
      const mockDeletedRecord = { id: '1', title: 'To Delete' }

      // Mock the select for finding existing record: db.select().from(table).where(sql).limit(1)
      const limitFn = vi.fn().mockResolvedValue([mockDeletedRecord])
      const whereFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      // Mock the delete chain: db.delete().from(table).where(sql)
      const deleteWhereFn = vi.fn().mockResolvedValue(undefined)
      mockDb.delete.mockReturnValue({
        where: deleteWhereFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const predicate = where((p) => [eq(p.id, '1')])

      const result = await dbAccess.posts.delete({
        where: predicate,
      })

      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.count).toBe(1)
        expect(result.value.records[0].id).toBe('1')
      }
    })

    it('returns error when no records match the predicate', async () => {
      // Mock the select for finding existing record - returns empty
      const limitFn = vi.fn().mockResolvedValue([])
      const whereFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const predicate = where((p) => [eq(p.id, 'non-existent')])

      const result = await dbAccess.posts.delete({
        where: predicate,
      })

      expect(isErr(result)).toBe(true)
    })
  })

  describe('count', () => {
    it('returns total count of records', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: 42 }]),
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.count()

      expect(result).toBe(42)
    })

    it('returns 0 when no records', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue([{ count: null }]),
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      const result = await dbAccess.posts.count()

      expect(result).toBe(0)
    })

    it('applies where clause when provided', async () => {
      const fromFn = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 5 }]),
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await dbAccess.posts.count({ where: {} as any })

      expect(fromFn).toHaveBeenCalled()
    })
  })

  describe('exists', () => {
    it('returns true when record exists', async () => {
      const limitFn = vi.fn().mockResolvedValue([{ id: '123' }])
      const whereFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await dbAccess.posts.exists({ where: {} as any })

      expect(result).toBe(true)
    })

    it('returns false when record does not exist', async () => {
      const limitFn = vi.fn().mockResolvedValue([])
      const whereFn = vi.fn().mockReturnValue({
        limit: limitFn,
      })
      const fromFn = vi.fn().mockReturnValue({
        where: whereFn,
      })
      mockDb.select.mockReturnValue({
        from: fromFn,
      })

      const dbAccess = createDbAccess(mockDb, mockDrizzleSchema, mockRawSchema)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await dbAccess.posts.exists({ where: {} as any })

      expect(result).toBe(false)
    })
  })
})
