/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Collection Operations - Pure Functions for Database Operations
 *
 * This module provides clean, testable functions for CRUD operations.
 * No classes - just pure functions that transform data.
 */

import { eq, and, like, gt, gte, lt, lte, isNull, inArray, not, desc, asc, count } from 'drizzle-orm'

import type { Collection, CollectionHooks, CreateHookContext, UpdateHookContext, DeleteHookContext, ReadHookContext, OperationHookContext } from '../collection'
import type {
  FindManyOptions,
  FindUniqueOptions,
  FindFirstOptions,
  CreateOptions,
  CreateManyOptions,
  UpdateOptions,
  UpdateManyOptions,
  DeleteOptions,
  DeleteManyOptions,
  CountOptions,
  ExistsOptions,
  WhereOperator,
  ValidationOptions
} from './types'

// ============================================================================
// Types
// ============================================================================

/**
 * Collection operations interface
 */
export interface CollectionOperations {
  findMany<T>(options?: FindManyOptions): Promise<T[]>
  findUnique<T>(options: FindUniqueOptions): Promise<T | undefined>
  findFirst<T>(options: FindFirstOptions): Promise<T | undefined>
  create<T>(options: CreateOptions<T>): Promise<T | undefined>
  createMany<T>(options: CreateManyOptions<T>): Promise<number>
  update<T>(options: UpdateOptions<T>): Promise<T | undefined>
  updateMany<T>(options: UpdateManyOptions<T>): Promise<number>
  delete<T>(options: DeleteOptions): Promise<T | undefined>
  deleteMany(options: DeleteManyOptions): Promise<number>
  count(options?: CountOptions): Promise<number>
  exists(options: ExistsOptions): Promise<boolean>
}

/**
 * Drizzle column type
 */
type DrizzleColumn = {
  [key: string]: unknown
}

/**
 * Table schema mapping column names to Drizzle columns
 */
type TableSchema = Record<string, DrizzleColumn>

// ============================================================================
// Operator Lookup Table (Instead of Massive if/else)
// ============================================================================

/**
 * Operator builders - single source of truth for all operators
 * This replaces the massive if/else chain
 */
const OPERATORS = {
  eq: (col: DrizzleColumn, value: unknown) => eq(col as never, value),
  neq: (col: DrizzleColumn, value: unknown) => not(eq(col as never, value)),
  gt: (col: DrizzleColumn, value: unknown) => gt(col as never, value as number),
  gte: (col: DrizzleColumn, value: unknown) => gte(col as never, value as number),
  lt: (col: DrizzleColumn, value: unknown) => lt(col as never, value as number),
  lte: (col: DrizzleColumn, value: unknown) => lte(col as never, value as number),
  in: (col: DrizzleColumn, value: unknown) => inArray(col as never, value as unknown[]),
  notIn: (col: DrizzleColumn, value: unknown) => not(inArray(col as never, value as unknown[])),
  contains: (col: DrizzleColumn, value: unknown) => like(col as never, `%${value}%`),
  startsWith: (col: DrizzleColumn, value: unknown) => like(col as never, `${value}%`),
  endsWith: (col: DrizzleColumn, value: unknown) => like(col as never, `%${value}`),
  isNull: (col: DrizzleColumn, _value: unknown) => isNull(col),
  not: (col: DrizzleColumn, value: unknown) => not(eq(col as never, value))
} as const

/**
 * Check if a value is a WhereOperator
 */
const isWhereOperator = (value: unknown): value is WhereOperator<unknown> => {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  const validKeys = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'notIn', 'contains', 'startsWith', 'endsWith', 'isNull', 'not']
  return Object.keys(obj).some(key => validKeys.includes(key))
}

// ============================================================================
// Pure Functions
// ============================================================================

/**
 * Build where conditions from options
 *
 * This is a pure function that transforms user input into Drizzle conditions.
 * Returns undefined if no conditions, or the SQL condition.
 */
export const buildWhereClause = (
  tableColumns: TableSchema,
  where?: Record<string, unknown>
): unknown => {
  if (!where) return undefined

  const conditions: unknown[] = []

  for (const [key, value] of Object.entries(where)) {
    const column = tableColumns[key]

    // Skip unknown columns (could throw error instead)
    if (!column) continue

    // Simple equality: { status: 'active' }
    if (value === null || typeof value !== 'object') {
      conditions.push(eq(column as never, value))
      continue
    }

    // Operator: { status: { eq: 'active' } }
    if (isWhereOperator(value)) {
      // Find which operator was provided
      for (const operatorKey of Object.keys(value) as (keyof typeof OPERATORS)[]) {
        const operatorValue = (value as Record<string, unknown>)[operatorKey]
        const builder = OPERATORS[operatorKey]

        if (builder && operatorValue !== undefined) {
          conditions.push(builder(column, operatorValue))
          break
        }
      }
    }
  }

  if (conditions.length === 0) return undefined
  if (conditions.length === 1) return conditions[0]
  return and(...conditions)
}

/**
 * Build orderBy from options
 */
export const buildOrderBy = (
  tableColumns: TableSchema,
  orderBy?: Record<string, unknown> | Record<string, unknown>[]
): unknown[] => {
  if (!orderBy) return []

  const orders = Array.isArray(orderBy) ? orderBy : [orderBy]
  return orders
    .map((order) => {
      for (const [key, direction] of Object.entries(order)) {
        const column = tableColumns[key]
        if (!column) continue
        return direction === 'desc' ? desc(column as never) : asc(column as never)
      }
      return undefined
    })
    .filter(Boolean)
}

/**
 * Validate limit value
 */
export const validateLimit = (
  limit: unknown,
  options: Required<ValidationOptions>
): { valid: false; error: { type: 'invalid_limit'; message: string } } | { valid: true; value: number } => {
  if (limit === undefined) return { valid: true, value: undefined as unknown as number }

  if (!Number.isInteger(limit) || limit < 0) {
    return { valid: false, error: { type: 'invalid_limit', message: 'limit must be a non-negative integer' } }
  }

  if (limit > options.maxLimit) {
    return { valid: false, error: { type: 'invalid_limit', message: `limit cannot exceed ${options.maxLimit}` } }
  }

  return { valid: true, value: limit as number }
}

/**
 * Validate offset value
 */
export const validateOffset = (
  offset: unknown,
  options: Required<ValidationOptions>
): { valid: false; error: { type: 'invalid_offset'; message: string } } | { valid: true; value: number } => {
  if (offset === undefined) return { valid: true, value: undefined as unknown as number }

  if (!Number.isInteger(offset) || offset < 0) {
    return { valid: false, error: { type: 'invalid_offset', message: 'offset must be a non-negative integer' } }
  }

  if (offset > options.maxOffset) {
    return { valid: false, error: { type: 'invalid_offset', message: `offset cannot exceed ${options.maxOffset}` } }
  }

  return { valid: true, value: offset as number }
}

// ============================================================================
// Hooks Execution (Simplified)
// ============================================================================

/**
 * Run a single hook
 */
const runHook = async (
  hook: ((context: unknown) => Promise<void> | void) | undefined,
  context: unknown
): Promise<void> => {
  if (!hook) return
  await hook(context)
}

/**
 * Run multiple hooks
 */
const runHooks = async (
  hooks: ((context: unknown) => Promise<void> | void)[] | undefined,
  context: unknown
): Promise<void> => {
  if (!hooks) return
  for (const hook of hooks) {
    await hook(context)
  }
}

// ============================================================================
// Collection Operations Factory
// ============================================================================

/**
 * Creates collection operations with Drizzle
 *
 * This is the main entry point - it wires together the pure functions.
 */
export const createCollectionOperations = (
  _collection: Collection,
  _slug: string,
  _db: unknown,
  _table: unknown,
  _hooks?: CollectionHooks,
  _validationOptions?: ValidationOptions
): CollectionOperations => {
  const tableColumns = _table as TableSchema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = _db as any
  const hooks = _hooks

  // Default validation options
  const validationOptions: Required<ValidationOptions> = {
    maxLimit: _validationOptions?.maxLimit ?? 10000,
    maxOffset: _validationOptions?.maxOffset ?? 100000
  }

  // If no db instance, return placeholder operations
  if (!db) {
    return {
      findMany: async <T>(): Promise<T[]> => [],
      findUnique: async <T>(): Promise<T | undefined> => undefined,
      findFirst: async <T>(): Promise<T | undefined> => undefined,
      create: async <T>(): Promise<T | undefined> => undefined,
      createMany: async (): Promise<number> => 0,
      update: async <T>(): Promise<T | undefined> => undefined,
      updateMany: async (): Promise<number> => 0,
      delete: async <T>(): Promise<T | undefined> => undefined,
      deleteMany: async (): Promise<number> => 0,
      count: async (): Promise<number> => 0,
      exists: async (): Promise<boolean> => false
    }
  }

  return {
    findMany: async <T>(options?: FindManyOptions): Promise<T[]> => {
      const whereClause = buildWhereClause(tableColumns, options?.where)
      const orderByClause = buildOrderBy(tableColumns, options?.orderBy)

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'read',
        where: options?.where
      })

      // Run beforeRead hooks
      await runHooks(hooks?.beforeRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        db
      })

      // Validate limit/offset
      if (options?.limit !== undefined) {
        const limitResult = validateLimit(options.limit, validationOptions)
        if (!limitResult.valid) throw new Error(limitResult.error.message)
      }
      if (options?.offset !== undefined) {
        const offsetResult = validateOffset(options.offset, validationOptions)
        if (!offsetResult.valid) throw new Error(offsetResult.error.message)
      }

      let query = db.select().from(_table)

      if (whereClause) {
        query = query.where(whereClause)
      }

      if (orderByClause.length > 0) {
        query = query.orderBy(...orderByClause)
      }

      if (options?.offset !== undefined) {
        query = query.offset(options.offset)
      }

      if (options?.limit !== undefined) {
        query = query.limit(options.limit)
      }

      const result = await query

      // Run afterRead hooks
      await runHooks(hooks?.afterRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result: result as unknown[],
        db
      })

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'read',
        where: options?.where,
        result
      })

      return result as T[]
    },

    findUnique: async <T>(options: FindUniqueOptions): Promise<T | undefined> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return undefined

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'read',
        where: options.where
      })

      // Run beforeRead hooks
      await runHooks(hooks?.beforeRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        db
      })

      const result = await db.select().from(_table).where(whereClause).limit(1)
      const returnValue = result[0] as T | undefined

      // Run afterRead hooks
      await runHooks(hooks?.afterRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result: returnValue ? [returnValue] : [],
        db
      })

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'read',
        where: options.where,
        result: returnValue
      })

      return returnValue
    },

    findFirst: async <T>(options: FindFirstOptions): Promise<T | undefined> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      const orderByClause = buildOrderBy(tableColumns, options.orderBy)

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'read',
        where: options.where
      })

      // Run beforeRead hooks
      await runHooks(hooks?.beforeRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        db
      })

      let query = db.select().from(_table)

      if (whereClause) {
        query = query.where(whereClause)
      }

      if (orderByClause.length > 0) {
        query = query.orderBy(...orderByClause)
      }

      const result = await query.limit(1)
      const returnValue = result[0] as T | undefined

      // Run afterRead hooks
      await runHooks(hooks?.afterRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result: returnValue ? [returnValue] : [],
        db
      })

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'read',
        where: options.where,
        result: returnValue
      })

      return returnValue
    },

    create: async <T>(options: CreateOptions<T>): Promise<T | undefined> => {
      const data = Array.isArray(options.data) ? options.data : [options.data]
      const firstData = data[0] as Record<string, unknown>

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'create',
        data: firstData,
        where: undefined
      })

      // Run beforeCreate hooks
      await runHooks(hooks?.beforeCreate, {
        collection: _slug,
        operation: 'create',
        data: firstData,
        db
      })

      const result = await db.insert(_table).values(data).returning()

      const returnValue = options.returning ? result[0] as T : undefined

      // Run afterCreate hooks
      await runHooks(hooks?.afterCreate, {
        collection: _slug,
        operation: 'create',
        data: firstData,
        result: returnValue,
        db
      })

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'create',
        data: firstData,
        result: returnValue
      })

      return returnValue
    },

    createMany: async <T>(options: CreateManyOptions<T>): Promise<number> => {
      const dataArray = Array.isArray(options.data) ? options.data : [options.data]

      // Run beforeOperation hooks for each item
      for (const data of dataArray) {
        await runHooks(hooks?.beforeOperation, {
          collection: _slug,
          operation: 'create',
          data: data as Record<string, unknown>,
          where: undefined
        })

        await runHooks(hooks?.beforeCreate, {
          collection: _slug,
          operation: 'create',
          data: data as Record<string, unknown>,
          db
        })
      }

      const result = await db.insert(_table).values(options.data as never)

      // Get the number of affected rows
      const affectedCount = result.rowCount ?? dataArray.length

      // Run afterOperation hooks for each item
      for (let i = 0; i < dataArray.length; i++) {
        await runHooks(hooks?.afterCreate, {
          collection: _slug,
          operation: 'create',
          data: dataArray[i] as Record<string, unknown>,
          result: result[i],
          db
        })

        await runHooks(hooks?.afterOperation, {
          collection: _slug,
          operation: 'create',
          data: dataArray[i] as Record<string, unknown>,
          result: result[i]
        })
      }

      return affectedCount
    },

    update: async <T>(options: UpdateOptions<T>): Promise<T | undefined> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return undefined

      // Get previous data for hooks
      const previousResult = await db.select().from(_table).where(whereClause).limit(1)
      const previousData = previousResult[0] as Record<string, unknown> | undefined

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where
      })

      // Run beforeUpdate hooks
      await runHooks(hooks?.beforeUpdate, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where,
        previousData,
        db
      })

      const result = await db.update(_table)
        .set(options.data as never)
        .where(whereClause)
        .returning()

      const returnValue = options.returning ? result[0] as T : undefined

      // Run afterUpdate hooks
      await runHooks(hooks?.afterUpdate, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where,
        previousData,
        result: returnValue,
        db
      })

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where,
        result: returnValue
      })

      return returnValue
    },

    updateMany: async <T>(options: UpdateManyOptions<T>): Promise<number> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return 0

      // Get previous data for hooks
      const previousResults = await db.select().from(_table).where(whereClause)

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where
      })

      // Run beforeUpdate hooks for each previous record
      for (const previousData of previousResults) {
        await runHooks(hooks?.beforeUpdate, {
          collection: _slug,
          operation: 'update',
          data: options.data as Record<string, unknown>,
          where: options.where,
          previousData: previousData as Record<string, unknown>,
          db
        })
      }

      const result = await db.update(_table)
        .set(options.data as never)
        .where(whereClause)

      // Get the number of affected rows
      const affectedCount = result.rowCount ?? 0

      // Run afterUpdate hooks
      for (const previousData of previousResults) {
        await runHooks(hooks?.afterUpdate, {
          collection: _slug,
          operation: 'update',
          data: options.data as Record<string, unknown>,
          where: options.where,
          previousData: previousData as Record<string, unknown>,
          db
        })
      }

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where
      })

      return affectedCount
    },

    delete: async <T>(options: DeleteOptions): Promise<T | undefined> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return undefined

      // Get previous data for hooks
      const previousResult = await db.select().from(_table).where(whereClause).limit(1)
      const previousData = previousResult[0] as Record<string, unknown> | undefined

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'delete',
        where: options.where
      })

      // Run beforeDelete hooks
      await runHooks(hooks?.beforeDelete, {
        collection: _slug,
        operation: 'delete',
        where: options.where,
        previousData,
        db
      })

      const result = await db.delete(_table)
        .where(whereClause)
        .returning()

      const returnValue = options.returning ? result[0] as T : undefined

      // Run afterDelete hooks
      await runHooks(hooks?.afterDelete, {
        collection: _slug,
        operation: 'delete',
        where: options.where,
        previousData,
        result: returnValue,
        db
      })

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'delete',
        where: options.where,
        result: returnValue
      })

      return returnValue
    },

    deleteMany: async (options: DeleteManyOptions): Promise<number> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return 0

      // Get previous data for hooks
      const previousResults = await db.select().from(_table).where(whereClause)

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'delete',
        where: options.where
      })

      // Run beforeDelete hooks
      for (const previousData of previousResults) {
        await runHooks(hooks?.beforeDelete, {
          collection: _slug,
          operation: 'delete',
          where: options.where,
          previousData: previousData as Record<string, unknown>,
          db
        })
      }

      const result = await db.delete(_table).where(whereClause)

      // Get the number of affected rows
      const affectedCount = result.rowCount ?? 0

      // Run afterDelete hooks
      for (const previousData of previousResults) {
        await runHooks(hooks?.afterDelete, {
          collection: _slug,
          operation: 'delete',
          where: options.where,
          previousData: previousData as Record<string, unknown>,
          db
        })
      }

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'delete',
        where: options.where
      })

      return affectedCount
    },

    count: async (options?: CountOptions): Promise<number> => {
      const whereClause = buildWhereClause(tableColumns, options?.where)

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'read',
        where: options?.where
      })

      // Run beforeRead hooks
      await runHooks(hooks?.beforeRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        db
      })

      // Use SQL COUNT for efficiency
      const countResult = whereClause
        ? await db.select({ count: count() }).from(_table).where(whereClause)
        : await db.select({ count: count() }).from(_table)

      const result = countResult[0]?.count ?? 0

      // Run afterRead hooks
      await runHooks(hooks?.afterRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result,
        db
      })

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'read',
        where: options?.where,
        result
      })

      return result
    },

    exists: async (options: ExistsOptions): Promise<boolean> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return false

      // Run beforeOperation hooks
      await runHooks(hooks?.beforeOperation, {
        collection: _slug,
        operation: 'read',
        where: options.where
      })

      // Run beforeRead hooks
      await runHooks(hooks?.beforeRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        db
      })

      const result = await db.select().from(_table).where(whereClause).limit(1)
      const returnValue = result.length > 0

      // Run afterRead hooks
      await runHooks(hooks?.afterRead, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result: result,
        db
      })

      // Run afterOperation hooks
      await runHooks(hooks?.afterOperation, {
        collection: _slug,
        operation: 'read',
        where: options.where,
        result: returnValue
      })

      return returnValue
    }
  }
}
