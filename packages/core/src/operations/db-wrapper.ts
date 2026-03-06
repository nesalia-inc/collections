/**
 * Database operations with cache key support
 *
 * This module provides pure functions for database operations.
 * No classes - just data transformation functions.
 */

import type { Collection, CollectionHooks } from '../collection'
import { createCollectionOperations, type CollectionOperations } from './collection-operations'
import type { ValidationOptions } from './types'

// ============================================================================
// Types
// ============================================================================

/**
 * Operation result with metadata (cache keys for reads, invalidate keys for writes)
 */
export interface OperationResult<T> {
  data: T
  meta: {
    cacheKeys?: string[]
    invalidateKeys?: string[]
  }
}

/**
 * Collection database with typed methods
 */
export interface CollectionDb<T = Record<string, unknown>> {
  find: (options?: FindOptions) => Promise<OperationResult<T[]>>
  findById: (id: number) => Promise<OperationResult<T | undefined>>
  findFirst: (options: FindFirstOptions) => Promise<OperationResult<T | undefined>>
  count: (options?: CountOptions) => Promise<OperationResult<number>>
  exists: (options: ExistsOptions) => Promise<OperationResult<boolean>>
  create: (options: CreateOptions) => Promise<OperationResult<T | undefined>>
  createMany: (options: CreateManyOptions) => Promise<OperationResult<number>>
  update: (options: UpdateOptions) => Promise<OperationResult<T | undefined>>
  updateMany: (options: UpdateManyOptions) => Promise<OperationResult<number>>
  delete: (options: DeleteOptions) => Promise<OperationResult<T | undefined>>
  deleteMany: (options: DeleteManyOptions) => Promise<OperationResult<number>>
}

/**
 * Database with all collections
 */
export interface Database {
  [collection: string]: CollectionDb
}

// ============================================================================
// Options Types (for documentation)
// ============================================================================

/** Options for find() */
export interface FindOptions {
  where?: Record<string, unknown>
  orderBy?: Record<string, unknown> | Record<string, unknown>[]
  limit?: number
  offset?: number
}

/** Options for findFirst() */
export interface FindFirstOptions {
  where: Record<string, unknown>
  orderBy?: Record<string, unknown> | Record<string, unknown>[]
}

/** Options for count() */
export interface CountOptions {
  where?: Record<string, unknown>
}

/** Options for exists() */
export interface ExistsOptions {
  where: Record<string, unknown>
}

/** Options for create() */
export interface CreateOptions {
  data: Record<string, unknown>
  returning?: boolean
}

/** Options for createMany() */
export interface CreateManyOptions {
  data: Record<string, unknown>[]
}

/** Options for update() */
export interface UpdateOptions {
  where: Record<string, unknown>
  data: Record<string, unknown>
  returning?: boolean
}

/** Options for updateMany() */
export interface UpdateManyOptions {
  where: Record<string, unknown>
  data: Record<string, unknown>
}

/** Options for delete() */
export interface DeleteOptions {
  where: Record<string, unknown>
  returning?: boolean
}

/** Options for deleteMany() */
export interface DeleteManyOptions {
  where: Record<string, unknown>
}

// ============================================================================
// Cache Key Generation (Pure Functions)
// ============================================================================

/**
 * Generate a cache key for a query
 */
export const generateCacheKey = (
  slug: string,
  method: string,
  where?: Record<string, unknown>
): string => {
  let key = `${slug}:${method}`

  if (where && Object.keys(where).length > 0) {
    const whereStr = Object.entries(where)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(':')
    key += `:${whereStr}`
  }

  return key
}

/**
 * Generate invalidate keys for a collection mutation
 */
export const generateInvalidateKeys = (slug: string): string[] => [
  `${slug}:*`,
  `${slug}:find:*`,
  `${slug}:findById:*`,
  `${slug}:count:*`,
  `${slug}:list`
]

// ============================================================================
// Higher-Order Metadata Functions
// ============================================================================

/**
 * Create a metadata generator for read operations (cache keys)
 */
const createCacheKeyGenerator = (slug: string, method: string, where?: Record<string, unknown>) => ({
  cacheKeys: [generateCacheKey(slug, method, where)]
})

/**
 * Create a metadata generator for write operations (invalidate keys)
 */
const createInvalidateKeyGenerator = (slug: string) => ({
  invalidateKeys: generateInvalidateKeys(slug)
})

// ============================================================================
// Collection Database (Pure Function - No Class)
// ============================================================================

/**
 * Create a collection database instance
 *
 * This is a pure function - it takes data and returns data.
 * No mutation, no hidden state.
 */
export const collectionDb = <T = Record<string, unknown>>(
  operations: CollectionOperations,
  slug: string
): CollectionDb<T> => ({
  find: async (options) => {
    const data = await operations.findMany<T>(options)
    return {
      data,
      meta: createCacheKeyGenerator(slug, 'find', options?.where)
    }
  },

  findById: async (id) => {
    const data = await operations.findUnique<T>({ where: { id } })
    return {
      data,
      meta: createCacheKeyGenerator(slug, 'findById', { id })
    }
  },

  findFirst: async (options) => {
    const data = await operations.findFirst<T>(options)
    return {
      data,
      meta: createCacheKeyGenerator(slug, 'findFirst', options.where)
    }
  },

  count: async (options) => {
    const data = await operations.count(options)
    return {
      data,
      meta: createCacheKeyGenerator(slug, 'count', options?.where)
    }
  },

  exists: async (options) => {
    const data = await operations.exists(options)
    return {
      data,
      meta: createCacheKeyGenerator(slug, 'exists', options.where)
    }
  },

  create: async (options) => {
    const data = await operations.create<T>(options as Parameters<typeof operations.create>[0])
    return {
      data,
      meta: createInvalidateKeyGenerator(slug)
    }
  },

  createMany: async (options) => {
    const data = await operations.createMany(options)
    return {
      data,
      meta: createInvalidateKeyGenerator(slug)
    }
  },

  update: async (options) => {
    const data = await operations.update<T>(options as Parameters<typeof operations.update>[0])
    return {
      data,
      meta: createInvalidateKeyGenerator(slug)
    }
  },

  updateMany: async (options) => {
    const data = await operations.updateMany(options)
    return {
      data,
      meta: createInvalidateKeyGenerator(slug)
    }
  },

  delete: async (options) => {
    const data = await operations.delete<T>(options)
    return {
      data,
      meta: createInvalidateKeyGenerator(slug)
    }
  },

  deleteMany: async (options) => {
    const data = await operations.deleteMany(options)
    return {
      data,
      meta: createInvalidateKeyGenerator(slug)
    }
  }
})

// ============================================================================
// Database Builder (Pure Function)
// ============================================================================

/**
 * Database configuration
 */
export interface DatabaseConfig {
  collections: Collection[]
  db: unknown
  schema: Record<string, unknown>
  validation?: ValidationOptions
}

/**
 * Create a database with all collections
 *
 * This is the main entry point - it takes config and returns a Database.
 * Named as "database" because that's what it returns (not "createDatabase")
 */
export const database = (config: DatabaseConfig): Database => {
  const { collections, db, schema, validation } = config

  return collections.reduce((acc, collection) => {
    const table = schema[collection.slug]
    if (!table) return acc

    const operations = createCollectionOperations(
      collection,
      collection.slug,
      db,
      table,
      collection.hooks,
      validation
    )

    acc[collection.slug] = collectionDb(operations, collection.slug)
    return acc
  }, {} as Database)
}

// ============================================================================
// Legacy Wrapper (For Backwards Compatibility)
// ============================================================================

/**
 * @deprecated Use database() instead
 *
 * DbWrapper class for backwards compatibility
 */
export class DbWrapper {
  private collections: Map<string, CollectionDb> = new Map()
  private validationOptions?: ValidationOptions

  setValidationOptions(options: ValidationOptions): void {
    this.validationOptions = options
  }

  register(
    slug: string,
    collection: Collection,
    db: unknown,
    table: Record<string, unknown>
  ): void {
    const operations = createCollectionOperations(
      collection,
      slug,
      db,
      table,
      collection.hooks,
      this.validationOptions
    )
    this.collections.set(slug, collectionDb(operations, slug))
  }

  get<T = Record<string, unknown>>(slug: string): CollectionDb<T> | undefined {
    return this.collections.get(slug) as CollectionDb<T> | undefined
  }

  has(slug: string): boolean {
    return this.collections.has(slug)
  }

  keys(): string[] {
    return Array.from(this.collections.keys())
  }
}

/**
 * @deprecated Use collectionDb() instead
 *
 * CollectionDbWrapper class for backwards compatibility
 */
export class CollectionDbWrapper<T = Record<string, unknown>> {
  private db: CollectionDb<T>

  constructor(
    collection: Collection,
    slug: string,
    db: unknown,
    table: Record<string, unknown>,
    hooks?: CollectionHooks,
    validationOptions?: ValidationOptions
  ) {
    const operations = createCollectionOperations(
      collection,
      slug,
      db,
      table,
      hooks,
      validationOptions
    )
    this.db = collectionDb(operations, slug)
  }

  async find(options?: FindOptions): Promise<OperationResult<T[]>> {
    return this.db.find(options)
  }

  async findById(id: number): Promise<OperationResult<T | undefined>> {
    return this.db.findById(id)
  }

  async findFirst(options: FindFirstOptions): Promise<OperationResult<T | undefined>> {
    return this.db.findFirst(options)
  }

  async count(options?: CountOptions): Promise<OperationResult<number>> {
    return this.db.count(options)
  }

  async exists(options: ExistsOptions): Promise<OperationResult<boolean>> {
    return this.db.exists(options)
  }

  async create(options: CreateOptions): Promise<OperationResult<T | undefined>> {
    return this.db.create(options)
  }

  async createMany(options: CreateManyOptions): Promise<OperationResult<number>> {
    return this.db.createMany(options)
  }

  async update(options: UpdateOptions): Promise<OperationResult<T | undefined>> {
    return this.db.update(options)
  }

  async updateMany(options: UpdateManyOptions): Promise<OperationResult<number>> {
    return this.db.updateMany(options)
  }

  async delete(options: DeleteOptions): Promise<OperationResult<T | undefined>> {
    return this.db.delete(options)
  }

  async deleteMany(options: DeleteManyOptions): Promise<OperationResult<number>> {
    return this.db.deleteMany(options)
  }
}
