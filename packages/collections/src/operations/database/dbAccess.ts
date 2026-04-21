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
import type { Collection } from '../../collections'
import type { GetCollectionType } from '../../collections/types'
import type { InferFieldTypes } from '../../collections/hooks/types'
import type { QueryContext, FindManyQuery, FindFirstQuery, FindQuery, CreateManyResult, UpdateResult, DeleteResult } from './types'
import type { CollectionDbMethods, DbAccess } from './types'
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
 * @param drizzleSchema - Map of table names to actual Drizzle table instances (for CRUD operations)
 * @param rawSchema - Map of table names to RawTable metadata (for predicate resolution)
 * @returns Object with CRUD methods per collection
 *
 * @example
 * ```typescript
 * const db = drizzle(connection, { schema: pgSchema })
 * const dbAccess = createDbAccess(db, pgSchema, rawSchemaMap)
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
/**
 * Create a type-safe database access object for collections
 *
 * @param db - Drizzle DB instance
 * @param drizzleSchema - Map of table names to actual Drizzle table instances (for CRUD operations)
 * @param collectionsOrRawSchema - Either Collection[] (new API) or Map<string, RawTable> (legacy API)
 * @returns Object with CRUD methods per collection
 *
 * @example
 * ```typescript
 * const db = drizzle(connection, { schema: pgSchema })
 * const dbAccess = createDbAccess(db, pgSchema, collections)
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
export function createDbAccess<TCollections extends Collection[]>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drizzleSchema: Record<string, any>,
  collections: TCollections
): DbAccess<TCollections>
export function createDbAccess<T extends Record<string, RawTable>>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drizzleSchema: Record<string, any>,
  rawSchema: Map<string, RawTable>
): DbAccessFromTableMap<T>
export function createDbAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  drizzleSchema: Record<string, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collectionsOrRawSchema: Collection[] | Map<string, RawTable>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  // Check if it's the new API (array of Collections) or legacy API (Map<string, RawTable>)
  const isNewApi = Array.isArray(collectionsOrRawSchema)

  if (isNewApi) {
    const collections = collectionsOrRawSchema as Collection[]
    const access: Record<string, CollectionDbMethods<Collection>> = {}

    for (const collection of collections) {
      const slug = collection.slug
      const drizzleTable = drizzleSchema[slug]
      if (!drizzleTable) {
        throw new Error(`Drizzle table not found for slug: ${slug}`)
      }

      access[slug] = {
        /**
         * Find multiple records matching query
         */
        findMany: async (query?: FindManyQuery<InferFieldTypes<typeof collection.fields>>, _ctx?: QueryContext) => {
          const whereSql = query?.where ? predicateToSql(query.where, drizzleTable) : undefined
          const orderBySql = query?.orderBy ? buildOrderBySQL(query.orderBy, drizzleTable) : undefined
          const options = {
            where: whereSql,
            orderBy: orderBySql,
            take: query?.limit,
            skip: query?.offset,
          }
          return (await findMany(db, drizzleTable, options)) as unknown as Promise<GetCollectionType<typeof collection>[]>
        },

        /**
         * Find records with pagination (returns Paginated<T>)
         * Note: This is a simplified implementation - full pagination requires more complex logic
         */
        find: async (query: FindQuery<InferFieldTypes<typeof collection.fields>>, _ctx?: QueryContext) => {
          const { pagination, ...rest } = query
          const limit = pagination.limit
          const offset = pagination._tag === 'OffsetPagination' ? pagination.offset : 0
          const includeTotal = pagination.includeTotal ?? false

          const whereSql = rest.where ? predicateToSql(rest.where, drizzleTable) : undefined
          const orderBySql = rest.orderBy ? buildOrderBySQL(rest.orderBy, drizzleTable) : undefined
          const options = {
            where: whereSql,
            orderBy: orderBySql,
            take: limit,
            skip: offset,
          }

          const [data, totalResult] = await Promise.all([
            (await findMany(db, drizzleTable, options)) as unknown as Promise<GetCollectionType<typeof collection>[]>,
            includeTotal ? count(db, drizzleTable, { where: whereSql }) : Promise.resolve(null),
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
                return null
              }
              const nextOffset = offset + limit
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const nextQuery: FindQuery<InferFieldTypes<typeof collection.fields>> = {
                ...rest,
                pagination: {
                  ...pagination,
                  offset: nextOffset,
                },
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (access[slug] as CollectionDbMethods<typeof collection>).find(nextQuery, _ctx)
            },
            previous: async () => {
              if (!hasPrevious) return null
              if (pagination._tag === 'CursorPagination') {
                return null
              }
              const prevOffset = Math.max(0, offset - limit)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const prevQuery: FindQuery<InferFieldTypes<typeof collection.fields>> = {
                ...rest,
                pagination: {
                  ...pagination,
                  offset: prevOffset,
                },
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (access[slug] as CollectionDbMethods<typeof collection>).find(prevQuery, _ctx)
            },
          }
        },

        /**
         * Find a single record by unique constraint (ID)
         */
        findUnique: async (query: { where: { id: string | number } }, _ctx?: QueryContext) => {
          return (await findOne(db, drizzleTable, String(query.where.id))) as unknown as Promise<GetCollectionType<typeof collection> | null>
        },

        /**
         * Find the first record matching query
         */
        findFirst: async (query?: FindFirstQuery<InferFieldTypes<typeof collection.fields>>, _ctx?: QueryContext) => {
          const whereSql = query?.where ? predicateToSql(query.where, drizzleTable) : undefined
          const orderBySql = query?.orderBy ? buildOrderBySQL(query.orderBy, drizzleTable) : undefined
          const options = {
            where: whereSql,
            orderBy: orderBySql,
            take: 1,
          }
          const results = await findMany(db, drizzleTable, options)
          return (results[0] ?? null) as unknown as GetCollectionType<typeof collection> | null
        },

        /**
         * Create a single record
         */
        create: async (input: { data: InferFieldTypes<typeof collection.fields> }, ctx?: QueryContext) => {
          const result = await create(db, drizzleTable, input.data as Record<string, unknown>, ctx ? { transaction: ctx.transaction } : undefined)
          if (!isOk(result)) {
            throw result.error
          }
          return result.value as unknown as GetCollectionType<typeof collection>
        },

        /**
         * Create multiple records in batch
         */
        createMany: async (input: { data: InferFieldTypes<typeof collection.fields>[] }, _ctx?: QueryContext) => {
          const result = await createMany(db, drizzleTable, input.data as Record<string, unknown>[])
          if (!isOk(result)) {
            throw result.error
          }
          return result.value as CreateManyResult
        },

        /**
         * Update records matching predicate
         */
        update: async (input: { where: Predicate<InferFieldTypes<typeof collection.fields>>, data: Partial<InferFieldTypes<typeof collection.fields>> }, _ctx?: QueryContext) => {
          const whereSql = predicateToSql(input.where, drizzleTable)
          if (whereSql === undefined) {
            throw new Error('Could not build WHERE clause for update')
          }

          const result = await update(db, drizzleTable, whereSql, input.data as Record<string, unknown>)
          if (!isOk(result)) {
            throw result.error
          }

          const records = Array.isArray(result.value) ? result.value : [result.value]
          return {
            records: records as unknown as GetCollectionType<typeof collection>[],
            count: records.length,
          }
        },

        /**
         * Delete records matching predicate
         */
        delete: async (query: { where: Predicate<InferFieldTypes<typeof collection.fields>> }, _ctx?: QueryContext) => {
          const whereSql = predicateToSql(query.where, drizzleTable)
          if (whereSql === undefined) {
            throw new Error('Could not build WHERE clause for delete')
          }
          const result = await remove(db, drizzleTable, whereSql)
          if (!isOk(result)) {
            throw result.error
          }
          return {
            records: [result.value] as unknown as GetCollectionType<typeof collection>[],
            count: 1,
          }
        },

        /**
         * Count records matching predicate
         */
        count: async (query?: { where?: Predicate<InferFieldTypes<typeof collection.fields>> }, _ctx?: QueryContext) => {
          const whereSql = query?.where ? predicateToSql(query.where, drizzleTable) : undefined
          return count(db, drizzleTable, { where: whereSql })
        },

        /**
         * Check if any record matches predicate
         */
        exists: async (query: { where: Predicate<InferFieldTypes<typeof collection.fields>> }, _ctx?: QueryContext) => {
          const whereSql = query.where ? predicateToSql(query.where, drizzleTable) : undefined
          return exists(db, drizzleTable, whereSql)
        },
      } as CollectionDbMethods<typeof collection>
    }

    return access
  }

  // Legacy API: Map<string, RawTable>
  const rawSchema = collectionsOrRawSchema as Map<string, RawTable>
  const access: Record<string, Record<string, unknown>> = {}

  for (const [slug, drizzleTable] of Object.entries(drizzleSchema)) {
    const rawTable = rawSchema.get(slug)
    if (!rawTable) {
      throw new Error(`RawTable not found for slug: ${slug}`)
    }

    access[slug] = {
      /**
       * Find multiple records matching query
       */
      findMany: async (query?: FindManyQuery<Record<string, unknown>>, _ctx?: QueryContext) => {
        const whereSql = query?.where ? predicateToSql(query.where, drizzleTable) : undefined
        const orderBySql = query?.orderBy ? buildOrderBySQL(query.orderBy, drizzleTable) : undefined
        const options = {
          where: whereSql,
          orderBy: orderBySql,
          take: query?.limit,
          skip: query?.offset,
        }
        return findMany(db, drizzleTable, options)
      },

      /**
       * Find records with pagination
       */
      find: async (query: FindQuery<Record<string, unknown>>, _ctx?: QueryContext) => {
        const { pagination, ...rest } = query
        const limit = pagination.limit
        const offset = pagination._tag === 'OffsetPagination' ? pagination.offset : 0
        const includeTotal = pagination.includeTotal ?? false

        const whereSql = rest.where ? predicateToSql(rest.where, drizzleTable) : undefined
        const orderBySql = rest.orderBy ? buildOrderBySQL(rest.orderBy, drizzleTable) : undefined
        const options = {
          where: whereSql,
          orderBy: orderBySql,
          take: limit,
          skip: offset,
        }

        const [data, totalResult] = await Promise.all([
          findMany(db, drizzleTable, options),
          includeTotal ? count(db, drizzleTable, { where: whereSql }) : Promise.resolve(null),
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
            return (access[slug] as CollectionDbMethodsFromTable).find({ ...rest, pagination: { ...pagination, offset: offset + limit } } as FindQuery<Record<string, unknown>>, _ctx)
          },
          previous: async () => {
            if (!hasPrevious) return null
            const prevOffset = Math.max(0, offset - limit)
            return (access[slug] as CollectionDbMethodsFromTable).find({ ...rest, pagination: { ...pagination, offset: prevOffset } } as FindQuery<Record<string, unknown>>, _ctx)
          },
        }
      },

      /**
       * Find a single record by unique constraint (ID)
       */
      findUnique: async (query: { where: { id: string | number } }, _ctx?: QueryContext) => {
        return findOne(db, drizzleTable, String(query.where.id))
      },

      /**
       * Find the first record matching query
       */
      findFirst: async (query?: FindFirstQuery<Record<string, unknown>>, _ctx?: QueryContext) => {
        const whereSql = query?.where ? predicateToSql(query.where, drizzleTable) : undefined
        const orderBySql = query?.orderBy ? buildOrderBySQL(query.orderBy, drizzleTable) : undefined
        const options = {
          where: whereSql,
          orderBy: orderBySql,
          take: 1,
        }
        const results = await findMany(db, drizzleTable, options)
        return results[0] ?? null
      },

      /**
       * Create a single record
       */
      create: async (input: { data: Record<string, unknown> }, ctx?: QueryContext) => {
        return create(db, drizzleTable, input.data, ctx ? { transaction: ctx.transaction } : undefined)
      },

      /**
       * Create multiple records in batch
       */
      createMany: async (input: { data: Record<string, unknown>[] }, _ctx?: QueryContext) => {
        return createMany(db, drizzleTable, input.data)
      },

      /**
       * Update records matching predicate
       */
      update: async (input: { where: Predicate<Record<string, unknown>>, data: Record<string, unknown> }, _ctx?: QueryContext) => {
        const whereSql = predicateToSql(input.where, drizzleTable)
        if (whereSql === undefined) {
          return err(InvalidPredicateError({ reason: 'Could not build WHERE clause for update' }))
        }

        const result = await update(db, drizzleTable, whereSql, input.data)
        if (!isOk(result)) {
          return result
        }

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
        const whereSql = predicateToSql(query.where, drizzleTable)
        if (whereSql === undefined) {
          return err(InvalidPredicateError({ reason: 'Could not build WHERE clause for delete' }))
        }
        const result = await remove(db, drizzleTable, whereSql)
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
        const whereSql = query?.where ? predicateToSql(query.where, drizzleTable) : undefined
        return count(db, drizzleTable, { where: whereSql })
      },

      /**
       * Check if any record matches predicate
       */
      exists: async (query: { where: Predicate<Record<string, unknown>> }, _ctx?: QueryContext) => {
        const whereSql = query.where ? predicateToSql(query.where, drizzleTable) : undefined
        return exists(db, drizzleTable, whereSql)
      },
    }
  }

  return access
}
