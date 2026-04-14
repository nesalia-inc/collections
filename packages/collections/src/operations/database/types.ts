// Database operation types - type-safe database access for collections

import type { Collection } from '../../collections'
import type { InferFieldTypes } from '../../collections/hooks/types'
import type { GetCollectionType } from '../../collections/types'
import type { Field } from '../../fields'
import type { PathProxy } from '../path'
import type { Predicate } from '../where'
import type { OrderBy } from '../order-by'
import type { ValidSelectValue } from '../select'
import type { PaginationInput, Paginated } from '../pagination'

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * InferCreateType - Extract the input type for create operations
 * A field is optional in create if it has a defaultValue/defaultFactory or is not required
 */
export type InferCreateType<TFields extends Record<string, Field<unknown>>> = {
  [K in keyof TFields]: TFields[K] extends Field<infer T>
    ? TFields[K]['required'] extends true
      ? T
      : TFields[K]['defaultValue'] extends (...args: unknown[]) => unknown
        ? T
        : T | undefined
    : never
}

/**
 * InferUpdateType - Extract the input type for update operations
 * All fields are optional (Partial semantics), but no required fields
 */
export type InferUpdateType<TFields extends Record<string, Field<unknown>>> = {
  [K in keyof TFields]?: TFields[K] extends Field<infer T> ? T : never
}

/**
 * SelectInput - Function that receives PathProxy and returns selection object
 * Usage: select: (p) => ({ id: p.id, title: p.title })
 */
export type SelectInput<T> = <TResult extends Record<string, ValidSelectValue>>(
  p: PathProxy<T>
) => TResult

// ============================================================================
// Query Context
// ============================================================================

/**
 * QueryContext - Optional context for query execution
 */
export interface QueryContext {
  /** Query timeout in milliseconds */
  readonly timeout?: number
  /** Transaction to use (if provided, operations join the transaction) */
  readonly transaction?: unknown
}

/**
 * TransactionContext - Context for explicit transaction management
 */
export interface TransactionContext {
  /** Transaction timeout in milliseconds */
  readonly timeout?: number
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * FindManyQuery - Query parameters for findMany
 */
export interface FindManyQuery<TData> {
  /** Filter predicate (uses type-safe WhereNode AST) */
  where?: Predicate<TData>
  /** Order by specification (multi-criteria supported) */
  orderBy?: OrderBy<TData>
  /** Maximum records to return */
  limit?: number
  /** Records to skip */
  offset?: number
  /** Field selection for field masking (reduces bandwidth) */
  select?: SelectInput<TData>
}

/**
 * FindFirstQuery - Query parameters for findFirst
 */
export interface FindFirstQuery<TData> {
  /** Filter predicate */
  where?: Predicate<TData>
  /** Order by specification */
  orderBy?: OrderBy<TData>
  /** Field selection - receives PathProxy<TData> */
  select?: SelectInput<TData>
}

/**
 * FindQuery - Query parameters for paginated find
 * Supports both offset and cursor pagination
 */
export interface FindQuery<TData> {
  /** Filter predicate */
  where?: Predicate<TData>
  /** Order by specification (required for cursor pagination) */
  orderBy?: OrderBy<TData>
  /** Field selection */
  select?: SelectInput<TData>
  /** Pagination specification (offset or cursor) */
  pagination: PaginationInput
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * UniqueInput - For operations targeting a single record by unique constraint
 * Supports primary key (id) or any unique field from TFields
 */
export type UniqueInput<TFields extends Record<string, Field<unknown>>> =
  | { id: string | number }
  | { [K in keyof TFields]-?: TFields[K] extends { unique: true } ? InferFieldTypes<TFields>[K] : never }

/**
 * CreateInput - Data for creating a record
 * Respects required vs optional based on Field definition
 */
export type CreateInput<TFields extends Record<string, Field<unknown>>> = {
  data: InferCreateType<TFields>
}

/**
 * CreateManyInput - Data for batch creating records
 */
export type CreateManyInput<TFields extends Record<string, Field<unknown>>> = {
  data: InferCreateType<TFields>[]
}

/**
 * UpdateInput - Data for updating records
 */
export type UpdateInput<TFields extends Record<string, Field<unknown>>> = {
  where: Predicate<InferFieldTypes<TFields>>
  data: InferUpdateType<TFields>
}

// ============================================================================
// Output Types
// ============================================================================

/**
 * CreateResult - Result of a create operation
 */
export type CreateResult<T> = {
  /** The created record */
  record: T
}

/**
 * CreateManyResult - Result of a createMany operation
 * Returns only identifiers to avoid memory issues with large inserts
 */
export type CreateManyResult = {
  /** Number of records inserted */
  count: number
  /** IDs of inserted records (for further operations if needed) */
  insertedIds?: (string | number)[]
}

/**
 * UpdateResult - Result of an update operation
 */
export type UpdateResult<T> = {
  /** Records updated */
  records: T[]
  /** Number of records affected */
  count: number
}

/**
 * DeleteResult - Result of a delete operation
 */
export type DeleteResult<T> = {
  /** Records deleted */
  records: T[]
  /** Number of records affected */
  count: number
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * CreateError - Errors specific to create operations
 */
export interface CreateError {
  code: 'ALREADY_EXISTS' | 'INCOMPLETE_DATA' | 'UNKNOWN'
  message: string
  fields?: string[]
}

/**
 * UniqueConstraintError - Thrown when a unique constraint is violated
 */
export interface UniqueConstraintError {
  code: 'UNIQUE_CONSTRAINT'
  field: string
  value: unknown
}

// ============================================================================
// Collection Database Methods
// ============================================================================

/**
 * CollectionDbMethods - Type-safe database methods for a collection
 * All methods accept optional QueryContext for transaction/timeout control
 */
export type CollectionDbMethods<T extends Collection> = {
  /**
   * Find multiple records matching query
   */
  findMany: (
    query?: FindManyQuery<InferFieldTypes<T['fields']>>,
    ctx?: QueryContext
  ) => Promise<GetCollectionType<T>[]>

  /**
   * Find records with pagination (returns Paginated<T>)
   */
  find: (
    query: FindQuery<InferFieldTypes<T['fields']>>,
    ctx?: QueryContext
  ) => Promise<Paginated<GetCollectionType<T>>>

  /**
   * Find a single record by unique constraint
   */
  findUnique: (
    query: { where: UniqueInput<T['fields']> },
    ctx?: QueryContext
  ) => Promise<GetCollectionType<T> | null>

  /**
   * Find the first record matching query
   */
  findFirst: (
    query?: FindFirstQuery<InferFieldTypes<T['fields']>>,
    ctx?: QueryContext
  ) => Promise<GetCollectionType<T> | null>

  /**
   * Create a single record
   */
  create: (
    input: CreateInput<T['fields']>,
    ctx?: QueryContext
  ) => Promise<GetCollectionType<T>>

  /**
   * Create multiple records in batch
   * Returns count only (not full records) for performance
   */
  createMany: (
    input: CreateManyInput<T['fields']>,
    ctx?: QueryContext
  ) => Promise<CreateManyResult>

  /**
   * Update records matching predicate
   */
  update: (
    input: UpdateInput<T['fields']>,
    ctx?: QueryContext
  ) => Promise<UpdateResult<GetCollectionType<T>>>

  /**
   * Delete records matching predicate
   */
  delete: (
    query: { where: Predicate<InferFieldTypes<T['fields']>> },
    ctx?: QueryContext
  ) => Promise<DeleteResult<GetCollectionType<T>>>

  /**
   * Count records matching predicate
   */
  count: (
    query?: { where?: Predicate<InferFieldTypes<T['fields']>> },
    ctx?: QueryContext
  ) => Promise<number>

  /**
   * Check if any record matches predicate
   */
  exists: (
    query: { where: Predicate<InferFieldTypes<T['fields']>> },
    ctx?: QueryContext
  ) => Promise<boolean>
}

// ============================================================================
// DbAccess
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractSlug<C> = C extends Collection<infer S, any> ? S : never

/**
 * DbAccess - Database access object for all collections
 * Provides type-safe access to collection methods via config.db.<collection>
 */
export type DbAccess<T extends Collection[]> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in ExtractSlug<T[number]>]: CollectionDbMethods<Extract<T[number], Collection<K, any>>>
}
