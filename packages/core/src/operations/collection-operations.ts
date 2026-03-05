/* eslint-disable @typescript-eslint/no-explicit-any */
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
 * Execute before operation hooks
 */
const executeBeforeOperationHooks = async (
  hooks: CollectionHooks | undefined,
  context: OperationHookContext
): Promise<void> => {
  if (!hooks?.beforeOperation) return
  for (const hook of hooks.beforeOperation) {
    await hook(context)
  }
}

/**
 * Execute after operation hooks
 */
const executeAfterOperationHooks = async (
  hooks: CollectionHooks | undefined,
  context: OperationHookContext
): Promise<void> => {
  if (!hooks?.afterOperation) return
  for (const hook of hooks.afterOperation) {
    await hook(context)
  }
}

/**
 * Execute before create hooks
 */
const executeBeforeCreateHooks = async (
  hooks: CollectionHooks | undefined,
  context: CreateHookContext
): Promise<void> => {
  if (!hooks?.beforeCreate) return
  for (const hook of hooks.beforeCreate) {
    await hook(context)
  }
}

/**
 * Execute after create hooks
 */
const executeAfterCreateHooks = async (
  hooks: CollectionHooks | undefined,
  context: CreateHookContext
): Promise<void> => {
  if (!hooks?.afterCreate) return
  for (const hook of hooks.afterCreate) {
    await hook(context)
  }
}

/**
 * Execute before update hooks
 */
const executeBeforeUpdateHooks = async (
  hooks: CollectionHooks | undefined,
  context: UpdateHookContext
): Promise<void> => {
  if (!hooks?.beforeUpdate) return
  for (const hook of hooks.beforeUpdate) {
    await hook(context)
  }
}

/**
 * Execute after update hooks
 */
const executeAfterUpdateHooks = async (
  hooks: CollectionHooks | undefined,
  context: UpdateHookContext
): Promise<void> => {
  if (!hooks?.afterUpdate) return
  for (const hook of hooks.afterUpdate) {
    await hook(context)
  }
}

/**
 * Execute before delete hooks
 */
const executeBeforeDeleteHooks = async (
  hooks: CollectionHooks | undefined,
  context: DeleteHookContext
): Promise<void> => {
  if (!hooks?.beforeDelete) return
  for (const hook of hooks.beforeDelete) {
    await hook(context)
  }
}

/**
 * Execute after delete hooks
 */
const executeAfterDeleteHooks = async (
  hooks: CollectionHooks | undefined,
  context: DeleteHookContext
): Promise<void> => {
  if (!hooks?.afterDelete) return
  for (const hook of hooks.afterDelete) {
    await hook(context)
  }
}

/**
 * Execute before read hooks
 */
const executeBeforeReadHooks = async (
  hooks: CollectionHooks | undefined,
  context: ReadHookContext
): Promise<void> => {
  if (!hooks?.beforeRead) return
  for (const hook of hooks.beforeRead) {
    await hook(context)
  }
}

/**
 * Execute after read hooks
 */
const executeAfterReadHooks = async (
  hooks: CollectionHooks | undefined,
  context: ReadHookContext
): Promise<void> => {
  if (!hooks?.afterRead) return
  for (const hook of hooks.afterRead) {
    await hook(context)
  }
}

/**
 * Creates collection operations with Drizzle
 */
export const createCollectionOperations = (
  _collection: Collection,
  _slug: string,
  _db: any,
  _table: any,
  _hooks?: CollectionHooks,
  _validationOptions?: ValidationOptions
): CollectionOperations => {
  const tableColumns = _table as Record<string, any>
  const db = _db as any
  const hooks = _hooks as CollectionHooks | undefined

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

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'read',
        where: options?.where
      })

      // Execute before read hooks
      await executeBeforeReadHooks(hooks, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        db
      })

      let query = db.select().from(_table)

      // Validate and normalize limit/offset
      const limit = options?.limit
      const offset = options?.offset

      // Validate limit - must be positive integer
      if (limit !== undefined) {
        if (!Number.isInteger(limit) || limit < 0) {
          throw new Error('limit must be a non-negative integer')
        }
        if (limit > validationOptions.maxLimit) {
          throw new Error(`limit cannot exceed ${validationOptions.maxLimit}`)
        }
      }

      // Validate offset - must be positive integer
      if (offset !== undefined) {
        if (!Number.isInteger(offset) || offset < 0) {
          throw new Error('offset must be a non-negative integer')
        }
        if (offset > validationOptions.maxOffset) {
          throw new Error(`offset cannot exceed ${validationOptions.maxOffset}`)
        }
      }

      if (whereClause) {
        query = query.where(whereClause)
      }

      if (orderByClause.length > 0) {
        query = query.orderBy(...orderByClause)
      }

      if (offset !== undefined) {
        query = query.offset(offset)
      }

      if (limit !== undefined) {
        query = query.limit(limit)
      }

      const result = await query

      // Execute after read hooks
      await executeAfterReadHooks(hooks, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result: result as unknown[],
        db
      })

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
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

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'read',
        where: options.where
      })

      // Execute before read hooks
      await executeBeforeReadHooks(hooks, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        db
      })

      const result = await db.select().from(_table).where(whereClause).limit(1)
      const returnValue = result[0] as T | undefined

      // Execute after read hooks
      await executeAfterReadHooks(hooks, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result: returnValue ? [returnValue] : [],
        db
      })

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
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

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'read',
        where: options.where
      })

      // Execute before read hooks
      await executeBeforeReadHooks(hooks, {
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

      // Execute after read hooks
      await executeAfterReadHooks(hooks, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result: returnValue ? [returnValue] : [],
        db
      })

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
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

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'create',
        data: firstData,
        where: undefined
      })

      // Execute before create hooks
      await executeBeforeCreateHooks(hooks, {
        collection: _slug,
        operation: 'create',
        data: firstData,
        db
      })

      const result = await db.insert(_table).values(data).returning()

      const returnValue = options.returning ? result[0] as T : undefined

      // Execute after create hooks
      await executeAfterCreateHooks(hooks, {
        collection: _slug,
        operation: 'create',
        data: firstData,
        result: returnValue,
        db
      })

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
        collection: _slug,
        operation: 'create',
        data: firstData,
        result: returnValue
      })

      return returnValue
    },

    createMany: async <T>(options: CreateManyOptions<T>): Promise<number> => {
      const dataArray = Array.isArray(options.data) ? options.data : [options.data]

      // Execute before operation hooks for each item
      for (const data of dataArray) {
        await executeBeforeOperationHooks(hooks, {
          collection: _slug,
          operation: 'create',
          data: data as Record<string, unknown>,
          where: undefined
        })

        await executeBeforeCreateHooks(hooks, {
          collection: _slug,
          operation: 'create',
          data: data as Record<string, unknown>,
          db
        })
      }

      const result = await db.insert(_table).values(options.data as any)

      // Get the number of affected rows
      const affectedCount = result.rowCount ?? dataArray.length

      // Execute after operation hooks for each item
      for (let i = 0; i < dataArray.length; i++) {
        await executeAfterCreateHooks(hooks, {
          collection: _slug,
          operation: 'create',
          data: dataArray[i] as Record<string, unknown>,
          result: result[i],
          db
        })

        await executeAfterOperationHooks(hooks, {
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

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where
      })

      // Execute before update hooks
      await executeBeforeUpdateHooks(hooks, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where,
        previousData,
        db
      })

      const result = await db.update(_table)
        .set(options.data as any)
        .where(whereClause)
        .returning()

      const returnValue = options.returning ? result[0] as T : undefined

      // Execute after update hooks
      await executeAfterUpdateHooks(hooks, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where,
        previousData,
        result: returnValue,
        db
      })

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
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

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'update',
        data: options.data as Record<string, unknown>,
        where: options.where
      })

      // Execute before update hooks (for each previous record)
      for (const previousData of previousResults) {
        await executeBeforeUpdateHooks(hooks, {
          collection: _slug,
          operation: 'update',
          data: options.data as Record<string, unknown>,
          where: options.where,
          previousData: previousData as Record<string, unknown>,
          db
        })
      }

      const result = await db.update(_table)
        .set(options.data as any)
        .where(whereClause)

      // Get the number of affected rows
      const affectedCount = result.rowCount ?? 0

      // Execute after update hooks
      for (const previousData of previousResults) {
        await executeAfterUpdateHooks(hooks, {
          collection: _slug,
          operation: 'update',
          data: options.data as Record<string, unknown>,
          where: options.where,
          previousData: previousData as Record<string, unknown>,
          db
        })
      }

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
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

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'delete',
        where: options.where
      })

      // Execute before delete hooks
      await executeBeforeDeleteHooks(hooks, {
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

      // Execute after delete hooks
      await executeAfterDeleteHooks(hooks, {
        collection: _slug,
        operation: 'delete',
        where: options.where,
        previousData,
        result: returnValue,
        db
      })

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
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

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'delete',
        where: options.where
      })

      // Execute before delete hooks
      for (const previousData of previousResults) {
        await executeBeforeDeleteHooks(hooks, {
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

      // Execute after delete hooks
      for (const previousData of previousResults) {
        await executeAfterDeleteHooks(hooks, {
          collection: _slug,
          operation: 'delete',
          where: options.where,
          previousData: previousData as Record<string, unknown>,
          db
        })
      }

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
        collection: _slug,
        operation: 'delete',
        where: options.where
      })

      return affectedCount
    },

    count: async (options?: CountOptions): Promise<number> => {
      const whereClause = buildWhereClause(tableColumns, options?.where)

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'read',
        where: options?.where
      })

      // Execute before read hooks
      await executeBeforeReadHooks(hooks, {
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

      // Execute after read hooks
      await executeAfterReadHooks(hooks, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result,
        db
      })

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
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

      // Execute before operation hooks
      await executeBeforeOperationHooks(hooks, {
        collection: _slug,
        operation: 'read',
        where: options.where
      })

      // Execute before read hooks
      await executeBeforeReadHooks(hooks, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        db
      })

      const result = await db.select().from(_table).where(whereClause).limit(1)
      const returnValue = result.length > 0

      // Execute after read hooks
      await executeAfterReadHooks(hooks, {
        collection: _slug,
        operation: 'read',
        query: options as unknown as Record<string, unknown>,
        result: result,
        db
      })

      // Execute after operation hooks
      await executeAfterOperationHooks(hooks, {
        collection: _slug,
        operation: 'read',
        where: options.where,
        result: returnValue
      })

      return returnValue
    }
  }
}
