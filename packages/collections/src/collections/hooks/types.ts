// Hook types - lifecycle hooks for collections

import type { Field } from '../../fields'

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Extract the value type from a Field<T>
 */
export type InferFieldType<T> = T extends Field<infer U> ? U : never

/**
 * Convert a record of Field<T> to a record of T (field values)
 */
export type InferFieldTypes<TFields extends Record<string, Field<unknown>>> = {
  [K in keyof TFields]: InferFieldType<TFields[K]>
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Operation types for hooks
 */
export type HookOperation = 'create' | 'read' | 'update' | 'delete'

/**
 * Base context for all hooks
 * @typeParam TCollectionSlug - The literal slug type of the collection
 */
export interface BaseHookContext<TCollectionSlug extends string = string> {
  /** Collection slug */
  readonly collection: TCollectionSlug
  /** Operation type */
  readonly operation: HookOperation
}

/**
 * Context for create operations
 * @typeParam TCollectionSlug - The literal slug type of the collection
 * @typeParam TFields - The fields of the collection
 */
export interface CreateHookContext<
  TCollectionSlug extends string = string,
  TFields extends Record<string, Field<unknown>> = Record<string, Field<unknown>>,
> extends BaseHookContext<TCollectionSlug> {
  readonly operation: 'create'
  /** Data being created (can be mutated) */
  data: Partial<InferFieldTypes<TFields>>
}

/**
 * Context for read operations
 * @typeParam TCollectionSlug - The literal slug type of the collection
 */
export interface ReadHookContext<TCollectionSlug extends string = string> extends BaseHookContext<TCollectionSlug> {
  readonly operation: 'read'
  /** Query parameters (can be mutated) */
  query: Record<string, unknown>
}

/**
 * Context for update operations
 * @typeParam TCollectionSlug - The literal slug type of the collection
 * @typeParam TFields - The fields of the collection
 */
export interface UpdateHookContext<
  TCollectionSlug extends string = string,
  TFields extends Record<string, Field<unknown>> = Record<string, Field<unknown>>,
> extends BaseHookContext<TCollectionSlug> {
  readonly operation: 'update'
  /** Update data (can be mutated) */
  data: Partial<InferFieldTypes<TFields>>
  /** Where clause */
  where: Record<string, unknown>
  /** Current record data before update */
  previousData: InferFieldTypes<TFields>
}

/**
 * Context for delete operations
 * @typeParam TCollectionSlug - The literal slug type of the collection
 * @typeParam TFields - The fields of the collection
 */
export interface DeleteHookContext<
  TCollectionSlug extends string = string,
  TFields extends Record<string, Field<unknown>> = Record<string, Field<unknown>>,
> extends BaseHookContext<TCollectionSlug> {
  readonly operation: 'delete'
  /** Where clause */
  where: Record<string, unknown>
  /** Current record data before delete */
  previousData: InferFieldTypes<TFields>
}

/**
 * Hook handler function type
 * @typeParam T - The hook context type
 */
export type HookHandler<T extends BaseHookContext> = (
  context: T
) => Promise<T> | T

/**
 * Collection hooks configuration
 * All hooks are optional and run within the same transaction as the operation
 * @typeParam TCollectionSlug - The literal slug type of the collection
 * @typeParam TFields - The fields of the collection
 */
export interface CollectionHooks<
  TCollectionSlug extends string = string,
  TFields extends Record<string, Field<unknown>> = Record<string, Field<unknown>>,
> {
  /** Called before any operation (after global beforeOperation) */
  readonly beforeOperation?: HookHandler<BaseHookContext<TCollectionSlug>>

  /** Called after any operation (before global afterOperation) */
  readonly afterOperation?: HookHandler<BaseHookContext<TCollectionSlug>>

  /** Called before creating a record */
  readonly beforeCreate?: HookHandler<CreateHookContext<TCollectionSlug, TFields>>

  /** Called after creating a record */
  readonly afterCreate?: HookHandler<CreateHookContext<TCollectionSlug, TFields>>

  /** Called before updating records */
  readonly beforeUpdate?: HookHandler<UpdateHookContext<TCollectionSlug, TFields>>

  /** Called after updating records */
  readonly afterUpdate?: HookHandler<UpdateHookContext<TCollectionSlug, TFields>>

  /** Called before deleting records */
  readonly beforeDelete?: HookHandler<DeleteHookContext<TCollectionSlug, TFields>>

  /** Called after deleting records */
  readonly afterDelete?: HookHandler<DeleteHookContext<TCollectionSlug, TFields>>

  /** Called before reading records */
  readonly beforeRead?: HookHandler<ReadHookContext<TCollectionSlug>>

  /** Called after reading records */
  readonly afterRead?: HookHandler<ReadHookContext<TCollectionSlug>>
}

// ============================================================
// COMPILE-TIME TYPE TESTS
// ============================================================
import { check } from '@deessejs/type-testing'
import type { Equal } from '@deessejs/type-testing'

// Test InferFieldType extracts inner type
check<Equal<
  InferFieldType<Field<string>>,
  string
>>()

check<Equal<
  InferFieldType<Field<number>>,
  number
>>()

check<Equal<
  InferFieldType<Field<boolean>>,
  boolean
>>()
