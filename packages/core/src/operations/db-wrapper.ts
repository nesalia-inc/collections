/**
 * Database wrapper that provides high-level API with cache key support
 */

import type { Collection, CollectionHooks } from '../collection'
import { createCollectionOperations, type CollectionOperations } from './collection-operations'

/**
 * Cache key generation
 */
function generateCacheKey(slug: string, method: string, where?: Record<string, unknown>): string {
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
 * Generate invalidate keys for a collection
 */
function generateInvalidateKeys(slug: string): string[] {
  return [
    `${slug}:*`,
    `${slug}:find:*`,
    `${slug}:findById:*`,
    `${slug}:count:*`,
    `${slug}:list`
  ]
}

/**
 * Operation result with metadata
 */
export interface OperationResult<T> {
  data: T
  meta: {
    cacheKeys?: string[]
    invalidateKeys?: string[]
  }
}

/**
 * Collection db wrapper with high-level API
 */
export class CollectionDbWrapper<T = Record<string, unknown>> {
  private operations: CollectionOperations
  private slug: string

  constructor(
    collection: Collection,
    slug: string,
    db: unknown,
    table: Record<string, unknown>,
    hooks?: CollectionHooks
  ) {
    this.slug = slug
    this.operations = createCollectionOperations(collection, slug, db, table, hooks)
  }

  /**
   * Find many records
   */
  async find(options?: {
    where?: Record<string, unknown>
    orderBy?: Record<string, unknown> | Record<string, unknown>[]
    limit?: number
    offset?: number
  }): Promise<OperationResult<T[]>> {
    const data = await this.operations.findMany<T>(options)
    const cacheKey = generateCacheKey(this.slug, 'find', options?.where)

    return {
      data,
      meta: {
        cacheKeys: [cacheKey]
      }
    }
  }

  /**
   * Find by ID
   */
  async findById(id: number): Promise<OperationResult<T | undefined>> {
    const data = await this.operations.findUnique<T>({ where: { id } })
    const cacheKey = generateCacheKey(this.slug, 'findById', { id })

    return {
      data,
      meta: {
        cacheKeys: [cacheKey]
      }
    }
  }

  /**
   * Find first matching record
   */
  async findFirst(options: {
    where: Record<string, unknown>
    orderBy?: Record<string, unknown> | Record<string, unknown>[]
  }): Promise<OperationResult<T | undefined>> {
    const data = await this.operations.findFirst<T>(options)
    const cacheKey = generateCacheKey(this.slug, 'findFirst', options.where)

    return {
      data,
      meta: {
        cacheKeys: [cacheKey]
      }
    }
  }

  /**
   * Count records
   */
  async count(options?: { where?: Record<string, unknown> }): Promise<OperationResult<number>> {
    const data = await this.operations.count(options)
    const cacheKey = generateCacheKey(this.slug, 'count', options?.where)

    return {
      data,
      meta: {
        cacheKeys: [cacheKey]
      }
    }
  }

  /**
   * Check if record exists
   */
  async exists(options: { where: Record<string, unknown> }): Promise<OperationResult<boolean>> {
    const data = await this.operations.exists(options)
    const cacheKey = generateCacheKey(this.slug, 'exists', options.where)

    return {
      data,
      meta: {
        cacheKeys: [cacheKey]
      }
    }
  }

  /**
   * Create a record
   */
  async create(options: { data: Record<string, unknown>; returning?: boolean }): Promise<OperationResult<T | undefined>> {
    const data = await this.operations.create<T>(options as any)
    const invalidateKeys = generateInvalidateKeys(this.slug)

    return {
      data,
      meta: {
        invalidateKeys
      }
    }
  }

  /**
   * Create multiple records
   */
  async createMany(options: { data: Record<string, unknown>[] }): Promise<OperationResult<number>> {
    const data = await this.operations.createMany(options)
    const invalidateKeys = generateInvalidateKeys(this.slug)

    return {
      data,
      meta: {
        invalidateKeys
      }
    }
  }

  /**
   * Update a record
   */
  async update(options: {
    where: Record<string, unknown>
    data: Record<string, unknown>
    returning?: boolean
  }): Promise<OperationResult<T | undefined>> {
    const data = await this.operations.update<T>(options as any)
    const invalidateKeys = generateInvalidateKeys(this.slug)

    return {
      data,
      meta: {
        invalidateKeys
      }
    }
  }

  /**
   * Update multiple records
   */
  async updateMany(options: {
    where: Record<string, unknown>
    data: Record<string, unknown>
  }): Promise<OperationResult<number>> {
    const data = await this.operations.updateMany(options)
    const invalidateKeys = generateInvalidateKeys(this.slug)

    return {
      data,
      meta: {
        invalidateKeys
      }
    }
  }

  /**
   * Delete a record
   */
  async delete(options: { where: Record<string, unknown>; returning?: boolean }): Promise<OperationResult<T | undefined>> {
    const data = await this.operations.delete<T>(options)
    const invalidateKeys = generateInvalidateKeys(this.slug)

    return {
      data,
      meta: {
        invalidateKeys
      }
    }
  }

  /**
   * Delete multiple records
   */
  async deleteMany(options: { where: Record<string, unknown> }): Promise<OperationResult<number>> {
    const data = await this.operations.deleteMany(options)
    const invalidateKeys = generateInvalidateKeys(this.slug)

    return {
      data,
      meta: {
        invalidateKeys
      }
    }
  }
}

/**
 * Database wrapper with all collections
 */
export class DbWrapper {
  private collections: Map<string, CollectionDbWrapper> = new Map()

  /**
   * Register a collection
   */
  register(
    slug: string,
    collection: Collection,
    db: unknown,
    table: Record<string, unknown>
  ): void {
    this.collections.set(slug, new CollectionDbWrapper(collection, slug, db, table, collection.hooks))
  }

  /**
   * Get a collection by slug
   */
  get<T = Record<string, unknown>>(slug: string): CollectionDbWrapper<T> | undefined {
    return this.collections.get(slug) as CollectionDbWrapper<T> | undefined
  }

  /**
   * Check if a collection exists
   */
  has(slug: string): boolean {
    return this.collections.has(slug)
  }

  /**
   * Get all collection slugs
   */
  keys(): string[] {
    return Array.from(this.collections.keys())
  }
}
