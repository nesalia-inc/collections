/* eslint-disable @typescript-eslint/no-explicit-any */
import { eq, and, like, gt, gte, lt, lte, isNull, inArray, not, desc, asc } from 'drizzle-orm'

import type { Collection } from '../collection'
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
  WhereOperator
} from './types'

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
 * Build where conditions from options
 */
const buildWhereClause = (
  tableColumns: Record<string, any>,
  where?: Record<string, unknown>
): any => {
  if (!where) return undefined

  const conditions: any[] = []

  for (const [key, value] of Object.entries(where)) {
    const column = tableColumns[key]
    if (!column) continue

    if (value === null || typeof value !== 'object') {
      conditions.push(eq(column, value))
    } else {
      const operator = value as WhereOperator<unknown>
      if ('eq' in operator) {
        conditions.push(eq(column, operator.eq))
      } else if ('neq' in operator) {
        conditions.push(not(eq(column, operator.neq)))
      } else if ('gt' in operator) {
        conditions.push(gt(column, operator.gt as number))
      } else if ('gte' in operator) {
        conditions.push(gte(column, operator.gte as number))
      } else if ('lt' in operator) {
        conditions.push(lt(column, operator.lt as number))
      } else if ('lte' in operator) {
        conditions.push(lte(column, operator.lte as number))
      } else if ('in' in operator) {
        conditions.push(inArray(column, operator.in))
      } else if ('notIn' in operator) {
        conditions.push(not(inArray(column, operator.notIn)))
      } else if ('contains' in operator) {
        conditions.push(like(column, `%${operator.contains}%`))
      } else if ('startsWith' in operator) {
        conditions.push(like(column, `${operator.startsWith}%`))
      } else if ('endsWith' in operator) {
        conditions.push(like(column, `%${operator.endsWith}`))
      } else if ('isNull' in operator) {
        if (operator.isNull) {
          conditions.push(isNull(column))
        }
      } else if ('not' in operator) {
        conditions.push(not(eq(column, operator.not)))
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
const buildOrderBy = (
  tableColumns: Record<string, any>,
  orderBy?: Record<string, unknown> | Record<string, unknown>[]
): any[] => {
  if (!orderBy) return []

  const orders = Array.isArray(orderBy) ? orderBy : [orderBy]
  return orders.map((order) => {
    for (const [key, direction] of Object.entries(order)) {
      const column = tableColumns[key]
      if (!column) continue
      return direction === 'desc' ? desc(column) : asc(column)
    }
    return undefined
  }).filter(Boolean)
}

/**
 * Creates collection operations with Drizzle
 */
export const createCollectionOperations = (
  _collection: Collection,
  _slug: string,
  _db: any,
  _table: any
): CollectionOperations => {
  const tableColumns = _table as Record<string, any>
  const db = _db as any

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

      let query = db.select().from(_table)

      if (whereClause) {
        query = query.where(whereClause)
      }

      if (orderByClause.length > 0) {
        query = query.orderBy(...orderByClause)
      }

      if (options?.offset) {
        query = query.offset(options.offset)
      }

      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const result = await query
      return result as T[]
    },

    findUnique: async <T>(options: FindUniqueOptions): Promise<T | undefined> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return undefined

      const result = await db.select().from(_table).where(whereClause).limit(1)
      return result[0] as T | undefined
    },

    findFirst: async <T>(options: FindFirstOptions): Promise<T | undefined> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      const orderByClause = buildOrderBy(tableColumns, options.orderBy)

      let query = db.select().from(_table)

      if (whereClause) {
        query = query.where(whereClause)
      }

      if (orderByClause.length > 0) {
        query = query.orderBy(...orderByClause)
      }

      const result = await query.limit(1)
      return result[0] as T | undefined
    },

    create: async <T>(options: CreateOptions<T>): Promise<T | undefined> => {
      const data = Array.isArray(options.data) ? options.data : [options.data]
      const result = await db.insert(_table).values(data).returning()

      return options.returning ? result[0] as T : undefined
    },

    createMany: async <T>(options: CreateManyOptions<T>): Promise<number> => {
      const result = await db.insert(_table).values(options.data as any)
      return result.length || 0
    },

    update: async <T>(options: UpdateOptions<T>): Promise<T | undefined> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return undefined

      const result = await db.update(_table)
        .set(options.data as any)
        .where(whereClause)
        .returning()

      return options.returning ? result[0] as T : undefined
    },

    updateMany: async <T>(options: UpdateManyOptions<T>): Promise<number> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return 0

      const result = await db.update(_table)
        .set(options.data as any)
        .where(whereClause)

      return result.length || 0
    },

    delete: async <T>(options: DeleteOptions): Promise<T | undefined> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return undefined

      const result = await db.delete(_table)
        .where(whereClause)
        .returning()

      return options.returning ? result[0] as T : undefined
    },

    deleteMany: async (options: DeleteManyOptions): Promise<number> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return 0

      const result = await db.delete(_table).where(whereClause)

      return result.length || 0
    },

    count: async (options?: CountOptions): Promise<number> => {
      const whereClause = buildWhereClause(tableColumns, options?.where)

      const result = whereClause
        ? await db.select().from(_table).where(whereClause)
        : await db.select().from(_table)

      return result.length
    },

    exists: async (options: ExistsOptions): Promise<boolean> => {
      const whereClause = buildWhereClause(tableColumns, options.where)
      if (!whereClause) return false

      const result = await db.select().from(_table).where(whereClause).limit(1)

      return result.length > 0
    }
  }
}
