// Hook types - lifecycle hooks for collections

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Operation types for hooks
 */
export type HookOperation = 'create' | 'read' | 'update' | 'delete'

/**
 * Base context for all hooks
 */
export interface BaseHookContext {
  /** Collection slug */
  readonly collection: string
  /** Operation type */
  readonly operation: HookOperation
}

/**
 * Context for create operations
 */
export interface CreateHookContext extends BaseHookContext {
  readonly operation: 'create'
  /** Data being created (can be mutated) */
  data: Record<string, unknown>
}

/**
 * Context for read operations
 */
export interface ReadHookContext extends BaseHookContext {
  readonly operation: 'read'
  /** Query parameters (can be mutated) */
  query: Record<string, unknown>
}

/**
 * Context for update operations
 */
export interface UpdateHookContext extends BaseHookContext {
  readonly operation: 'update'
  /** Update data (can be mutated) */
  data: Record<string, unknown>
  /** Where clause */
  where: Record<string, unknown>
  /** Current record data before update */
  previousData: Record<string, unknown>
}

/**
 * Context for delete operations
 */
export interface DeleteHookContext extends BaseHookContext {
  readonly operation: 'delete'
  /** Where clause */
  where: Record<string, unknown>
  /** Current record data before delete */
  previousData: Record<string, unknown>
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
 */
export interface CollectionHooks {
  /** Called before any operation (after global beforeOperation) */
  readonly beforeOperation?: HookHandler<BaseHookContext>

  /** Called after any operation (before global afterOperation) */
  readonly afterOperation?: HookHandler<BaseHookContext>

  /** Called before creating a record */
  readonly beforeCreate?: HookHandler<CreateHookContext>

  /** Called after creating a record */
  readonly afterCreate?: HookHandler<CreateHookContext>

  /** Called before updating records */
  readonly beforeUpdate?: HookHandler<UpdateHookContext>

  /** Called after updating records */
  readonly afterUpdate?: HookHandler<UpdateHookContext>

  /** Called before deleting records */
  readonly beforeDelete?: HookHandler<DeleteHookContext>

  /** Called after deleting records */
  readonly afterDelete?: HookHandler<DeleteHookContext>

  /** Called before reading records */
  readonly beforeRead?: HookHandler<ReadHookContext>

  /** Called after reading records */
  readonly afterRead?: HookHandler<ReadHookContext>
}
