/**
 * DbAccess - Type-safe database access for collections
 *
 * This module provides a high-level API that wires CRUD operations to collections.
 * It takes a Drizzle DB instance and a schema (table map), and returns an object
 * with typed methods per collection.
 *
 * Example usage:
 * ```typescript
 * const db = drizzle(connection, { schema: pgSchema })
 * const dbAccess = createDbAccess(db, pgSchema)
 * const posts = dbAccess.posts
 * await posts.findMany({ where: ... })
 * await posts.create({ data: { title: 'Hello' } })
 * ```
 */

import { err, ok, attemptAsync, isTryOk, isOk, type Result, type Error } from '@deessejs/core'
import { eq } from 'drizzle-orm'
import { count as drizzleCount } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import type { RawTable } from '../../adapter/core/types'
import { InsertFailedError, InvalidPredicateError, RecordNotFoundError } from '../../adapter/crud/errors'
import type { QueryContext, FindManyQuery, FindFirstQuery, FindQuery, CreateManyResult, UpdateResult, DeleteResult } from './types'
import type { Predicate } from '../where'
import type { Paginated } from '../pagination'
import { predicateToSql, buildOrderBySQL } from './sqlBuilder'

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Extract the slug (table name key) from a Record<string, RawTable>
 */
type ExtractSlugFromTableMap<T extends Record<string, RawTable>> = keyof T & string

/**
 * DbAccess type for table-based schema
 * Maps each table name to CRUD methods
 */
export type DbAccessFromTableMap<T extends Record<string, RawTable>> = {
  [K in ExtractSlugFromTableMap<T>]: CollectionDbMethodsFromTable
}

/**
 * CollectionDbMethods extracted from a RawTable for a single collection
 * This is a simplified version since we don't have full Field information
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CollectionDbMethodsFromTable = {
  findMany: (query?: FindManyQuery<Record<string, unknown>>, ctx?: QueryContext) => Promise<Record<string, unknown>[]>
  find: (query: FindQuery<Record<string, unknown>>, ctx?: QueryContext) => Promise<Paginated<Record<string, unknown>>>
  findUnique: (query: { where: { id: string | number } }, ctx?: QueryContext) => Promise<Record<string, unknown> | null>
  findFirst: (query?: FindFirstQuery<Record<string, unknown>>, ctx?: QueryContext) => Promise<Record<string, unknown> | null>
  create: (input: { data: Record<string, unknown> }, ctx?: QueryContext) => Promise<Result<Record<string, unknown>, Error>>
  createMany: (input: { data: Record<string, unknown>[] }, ctx?: QueryContext) => Promise<Result<CreateManyResult, Error>>
  update: (input: { where: Predicate<Record<string, unknown>>, data: Record<string, unknown> }, ctx?: QueryContext) => Promise<Result<UpdateResult<Record<string, unknown>>, Error>>
  delete: (query: { where: Predicate<Record<string, unknown>> }, ctx?: QueryContext) => Promise<Result<DeleteResult<Record<string, unknown>>, Error>>
  count: (query?: { where?: Predicate<Record<string, unknown>> }, ctx?: QueryContext) => Promise<number>
  exists: (query: { where: Predicate<Record<string, unknown>> }, ctx?: QueryContext) => Promise<boolean>
}

// ============================================================================
// CRUD Implementations
// ============================================================================

/**
 * Find many records
 * Note: Returns raw array - connection errors will throw. Use Result-wrapped versions in public API.
 */
const findMany = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  options?: {
    where?: SQL
    orderBy?: SQL | SQL[]
    take?: number
    skip?: number
  }
): Promise<Record<string, unknown>[]> => {
  let query = db.select().from(table)

  if (options?.where) {
    query = query.where(options.where)
  }

  if (options?.orderBy) {
    const orderByItems = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]
    query = query.orderBy(...orderByItems)
  }

  if (options?.take !== undefined) {
    query = query.limit(options.take)
  }

  if (options?.skip !== undefined) {
    query = query.offset(options.skip)
  }

  return await query
}

/**
 * Find a single record by ID
 */
const findOne = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  id: string
): Promise<Record<string, unknown> | null> => {
  const result = await db.select().from(table).where(eq(table.id, id)).limit(1)
  return result[0] ?? null
}

/**
 * Create a single record
 */
const create = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  data: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
): Promise<Result<Record<string, unknown>, Error>> => {
  const dataToInsert = options?.hooks?.beforeCreate
    ? await options.hooks.beforeCreate(data)
    : data

  const dbResult = await attemptAsync(
    () => db.insert(table).values(dataToInsert).returning() as Promise<Record<string, unknown>[]>
  )

  if (!isTryOk(dbResult)) {
    return err(dbResult.error as Error)
  }

  const result = dbResult.value

  if (options?.hooks?.afterCreate && result.length > 0) {
    await options.hooks.afterCreate(result[0])
  }

  if (result.length === 0) {
    return err(InsertFailedError({ reason: 'Insert failed' }))
  }

  return ok(result[0])
}

/**
 * Create many records in batch
 */
const createMany = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  data: Record<string, unknown>[]
): Promise<Result<CreateManyResult, Error>> => {
  if (data.length === 0) {
    return ok({ count: 0 })
  }

  const dbResult = await attemptAsync(
    () => db.insert(table).values(data).returning({ id: table.id }) as Promise<Record<string, unknown>[]>
  )

  if (!isTryOk(dbResult)) {
    return err(dbResult.error as Error)
  }

  const result = dbResult.value
  return ok({
    count: data.length,
    insertedIds: result.map((r: Record<string, unknown>) => r.id) as (string | number)[],
  })
}

/**
 * Update records by predicate
 */
const update = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any,
  data: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
): Promise<Result<Record<string, unknown>[], Error>> => {
  const dataToUpdate = options?.hooks?.beforeUpdate
    ? await options.hooks.beforeUpdate(data)
    : data

  const dbResult = await attemptAsync(
    () => db.update(table).set(dataToUpdate).where(where).returning() as Promise<Record<string, unknown>[]>
  )

  if (!isTryOk(dbResult)) {
    return err(dbResult.error as Error)
  }

  const result = dbResult.value

  if (result.length === 0) {
    return err(RecordNotFoundError({ id: 'unknown' }))
  }

  if (options?.hooks?.afterUpdate) {
    await options.hooks.afterUpdate(result[0])
  }

  return ok(result)
}

/**
 * Delete records by predicate
 */
const remove = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  where: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: any
): Promise<Result<Record<string, unknown>, Error>> => {
  // First, get the records to be deleted for potential hooks and return value
  const existing = await db.select().from(table).where(where).limit(1)

  if (existing.length === 0) {
    return err(RecordNotFoundError({ id: 'unknown' }))
  }

  const recordToReturn = existing[0]

  if (options?.hooks?.beforeDelete) {
    await options.hooks.beforeDelete(recordToReturn)
  }

  await db.delete(table).where(where)

  if (options?.hooks?.afterDelete) {
    await options.hooks.afterDelete(recordToReturn)
  }

  return ok(recordToReturn)
}

/**
 * Count records matching a predicate
 * Note: Returns raw number - connection errors will throw. These are internal helpers;
 * the public API methods (count/exists in CollectionDbMethodsFromTable) are the
 * public interface and handle errors appropriately.
 */
const count = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  options?: { where?: SQL }
): Promise<number> => {
  let query = db.select({ count: drizzleCount() }).from(table)

  if (options?.where) {
    query = query.where(options.where)
  }

  const result = await query
  return result[0]?.count ?? 0
}

/**
 * Check if any record exists matching a predicate
 * Note: Returns raw boolean - connection errors will throw. These are internal helpers;
 * the public API methods (count/exists in CollectionDbMethodsFromTable) are the
 * public interface and handle errors appropriately.
 */
const exists = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  where?: SQL
): Promise<boolean> => {
  const result = await db.select({ id: table.id }).from(table).where(where).limit(1)
  return result.length > 0
}

// ============================================================================
// DbAccess Factory
// ============================================================================

/**
 * Create a type-safe database access object for collections
 *
 * @param db - Drizzle DB instance
 * @param rawSchema - Map of table names to Drizzle tables (Record<string, RawTable>)
 * @returns Object with CRUD methods per collection
 *
 * @example
 * ```typescript
 * const db = drizzle(connection, { schema: pgSchema })
 * const dbAccess = createDbAccess(db, pgSchema)
 * const posts = dbAccess.posts
 *
 * // Find many
 * const allPosts = await posts.findMany()
 *
 * // Find with pagination
 * const paginatedPosts = await posts.find({
 *   where: somePredicate,
 *   orderBy: orderByDesc('createdAt'),
 *   pagination: offset(10, 0),
 * })
 *
 * // Create
 * const newPost = await posts.create({ data: { title: 'Hello' } })
 *
 * // Update
 * const updated = await posts.update({
 *   where: whereEq('id', 'some-id'),
 *   data: { title: 'Updated' },
 * })
 *
 * // Delete
 * await posts.delete({ where: whereEq('id', 'some-id') })
 *
 * // Count
 * const total = await posts.count({ where: somePredicate })
 *
 * // Exists
 * const hasDrafts = await posts.exists({ where: whereEq('published', false) })
 * ```
 */
export const createDbAccess = <T extends Record<string, RawTable>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  rawSchema: T
): DbAccessFromTableMap<T> => {
  const access: Record<string, Record<string, unknown>> = {}

  for (const [slug, table] of Object.entries(rawSchema)) {
    access[slug] = {
      /**
       * Find multiple records matching query
       */
      findMany: async (query?: FindManyQuery<Record<string, unknown>>, _ctx?: QueryContext) => {
        const whereSql = query?.where ? predicateToSql(query.where, table) : undefined
        const orderBySql = query?.orderBy ? buildOrderBySQL(query.orderBy, table) : undefined
        const options = {
          where: whereSql,
          orderBy: orderBySql,
          take: query?.limit,
          skip: query?.offset,
        }
        return findMany(db, table, options)
      },

      /**
       * Find records with pagination (returns Paginated<T>)
       * Note: This is a simplified implementation - full pagination requires more complex logic
       */
      find: async (query: FindQuery<Record<string, unknown>>, _ctx?: QueryContext) => {
        const { pagination, ...rest } = query
        const limit = pagination.limit
        const offset = pagination._tag === 'OffsetPagination' ? pagination.offset : 0
        const includeTotal = pagination.includeTotal ?? false

        const whereSql = rest.where ? predicateToSql(rest.where, table) : undefined
        const orderBySql = rest.orderBy ? buildOrderBySQL(rest.orderBy, table) : undefined
        const options = {
          where: whereSql,
          orderBy: orderBySql,
          take: limit,
          skip: offset,
        }

        const [data, totalResult] = await Promise.all([
          findMany(db, table, options),
          includeTotal ? count(db, table, { where: whereSql }) : Promise.resolve(null),
        ])

        const hasNext = data.length === limit
        const hasPrevious = offset > 0

        return {
          current: {
            data,
            total: totalResult,
            limit,
            offset,
          },
          hasNext,
          hasPrevious,
          next: async () => {
            if (!hasNext) return null
            if (pagination._tag === 'CursorPagination') {
              // Cursor pagination: use the last item's cursor for next page
              // For simplicity, we just return null here - full cursor impl would encode cursor from last item
              return null
            }
            const nextQuery: FindQuery<Record<string, unknown>> = {
              ...rest,
              pagination: {
                ...pagination,
                offset: offset + limit,
              },
            }
            return (access[slug] as CollectionDbMethodsFromTable).find(nextQuery, _ctx)
          },
          previous: async () => {
            if (!hasPrevious) return null
            if (pagination._tag === 'CursorPagination') {
              // Cursor pagination: previous is not supported in this simplified impl
              return null
            }
            const prevOffset = Math.max(0, offset - limit)
            const prevQuery: FindQuery<Record<string, unknown>> = {
              ...rest,
              pagination: {
                ...pagination,
                offset: prevOffset,
              },
            }
            return (access[slug] as CollectionDbMethodsFromTable).find(prevQuery, _ctx)
          },
        }
      },

      /**
       * Find a single record by unique constraint (ID)
       */
      findUnique: async (query: { where: { id: string | number } }, _ctx?: QueryContext) => {
        return findOne(db, table, String(query.where.id))
      },

      /**
       * Find the first record matching query
       */
      findFirst: async (query?: FindFirstQuery<Record<string, unknown>>, _ctx?: QueryContext) => {
        const whereSql = query?.where ? predicateToSql(query.where, table) : undefined
        const orderBySql = query?.orderBy ? buildOrderBySQL(query.orderBy, table) : undefined
        const options = {
          where: whereSql,
          orderBy: orderBySql,
          take: 1,
        }
        const results = await findMany(db, table, options)
        return results[0] ?? null
      },

      /**
       * Create a single record
       */
      create: async (input: { data: Record<string, unknown> }, ctx?: QueryContext) => {
        return create(db, table, input.data, ctx ? { transaction: ctx.transaction } : undefined)
      },

      /**
       * Create multiple records in batch
       */
      createMany: async (input: { data: Record<string, unknown>[] }, _ctx?: QueryContext) => {
        return createMany(db, table, input.data)
      },

      /**
       * Update records matching predicate
       */
      update: async (input: { where: Predicate<Record<string, unknown>>, data: Record<string, unknown> }, _ctx?: QueryContext) => {
        const whereSql = predicateToSql(input.where, table)
        if (whereSql === undefined) {
          return err(InvalidPredicateError({ reason: 'Could not build WHERE clause for update' }))
        }

        const result = await update(db, table, whereSql, input.data)
        if (!isOk(result)) {
          return result
        }

        // result.value can be an array (multiple records) or single record
        const records = Array.isArray(result.value) ? result.value : [result.value]
        return ok({
          records,
          count: records.length,
        })
      },

      /**
       * Delete records matching predicate
       */
      delete: async (query: { where: Predicate<Record<string, unknown>> }, _ctx?: QueryContext) => {
        const whereSql = predicateToSql(query.where, table)
        if (whereSql === undefined) {
          return err(InvalidPredicateError({ reason: 'Could not build WHERE clause for delete' }))
        }
        const result = await remove(db, table, whereSql)
        if (!isOk(result)) {
          return result
        }
        return ok({
          records: [result.value],
          count: 1,
        })
      },

      /**
       * Count records matching predicate
       */
      count: async (query?: { where?: Predicate<Record<string, unknown>> }, _ctx?: QueryContext) => {
        const whereSql = query?.where ? predicateToSql(query.where, table) : undefined
        return count(db, table, { where: whereSql })
      },

      /**
       * Check if any record matches predicate
       */
      exists: async (query: { where: Predicate<Record<string, unknown>> }, _ctx?: QueryContext) => {
        // If where clause is invalid/empty, predicateToSql returns undefined
        // In that case, pass undefined to exists to check if any record exists
        const whereSql = query.where ? predicateToSql(query.where, table) : undefined
        return exists(db, table, whereSql)
      },
    }
  }

  return access as DbAccessFromTableMap<T>
}
