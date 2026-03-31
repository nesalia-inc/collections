// Hook executor builders - run*Hooks functions

import type { Field } from '../../fields'
import type {
  CollectionHooks,
  BaseHookContext,
  CreateHookContext,
  ReadHookContext,
  UpdateHookContext,
  DeleteHookContext,
  HookHandler,
  InferFieldTypes,
} from './types'

// ============================================================================
// Hook Executors
// ============================================================================

/**
 * Execute a hook handler, allowing both sync and async return
 */
const executeHook = async <T extends BaseHookContext>(
  handler: HookHandler<T> | undefined,
  context: T
): Promise<T> => {
  if (!handler) return context

  const result = handler(context)

  // Support both Promise and sync return
  return result instanceof Promise ? result : result
}

/**
 * Execute before operation hooks
 */
const executeBeforeOperation = async <
  TSlug extends string,
  TFields extends Record<string, Field<unknown>>,
>(
  hooks: CollectionHooks<TSlug, TFields>,
  context: BaseHookContext<TSlug>
): Promise<BaseHookContext<TSlug>> => {
  const ctx = await executeHook(hooks.beforeOperation, context)
  return ctx
}

// ============================================================================
// Run*Hooks Functions
// ============================================================================

/**
 * Run create operation hooks
 */
export const runCreateHooks = async <
  TSlug extends string,
  TFields extends Record<string, Field<unknown>>,
>(
  hooks: CollectionHooks<TSlug, TFields>,
  data: Partial<InferFieldTypes<TFields>>
): Promise<{ data: Partial<InferFieldTypes<TFields>> }> => {
  const baseContext: BaseHookContext<TSlug> = {
    collection: '' as TSlug, // Set by caller
    operation: 'create',
  }

  // beforeOperation
  const ctx = await executeBeforeOperation(hooks, baseContext)

  // Create context
  const createContext: CreateHookContext<TSlug, TFields> = {
    ...ctx,
    operation: 'create',
    data,
  }

  // beforeCreate
  const result = await executeHook(hooks.beforeCreate, createContext)

  // Return modified data
  return { data: result.data }
}

/**
 * Run read operation hooks
 */
export const runReadHooks = async <TSlug extends string>(
  hooks: CollectionHooks<TSlug>,
  query: Record<string, unknown>
): Promise<{ query: Record<string, unknown> }> => {
  const baseContext: BaseHookContext<TSlug> = {
    collection: '' as TSlug,
    operation: 'read',
  }

  // beforeOperation
  const ctx = await executeBeforeOperation(hooks, baseContext)

  // Read context
  const readContext: ReadHookContext<TSlug> = {
    ...ctx,
    operation: 'read',
    query,
  }

  // beforeRead
  const result = await executeHook(hooks.beforeRead, readContext)

  return { query: result.query }
}

/**
 * Run update operation hooks
 */
export const runUpdateHooks = async <
  TSlug extends string,
  TFields extends Record<string, Field<unknown>>,
>(
  hooks: CollectionHooks<TSlug, TFields>,
  data: Partial<InferFieldTypes<TFields>>,
  where: Record<string, unknown>,
  previousData: InferFieldTypes<TFields>
): Promise<{
  data: Partial<InferFieldTypes<TFields>>
  where: Record<string, unknown>
  previousData: InferFieldTypes<TFields>
}> => {
  const baseContext: BaseHookContext<TSlug> = {
    collection: '' as TSlug,
    operation: 'update',
  }

  // beforeOperation
  const ctx = await executeBeforeOperation(hooks, baseContext)

  // Update context
  const updateContext: UpdateHookContext<TSlug, TFields> = {
    ...ctx,
    operation: 'update',
    data,
    where,
    previousData,
  }

  // beforeUpdate
  const result = await executeHook(hooks.beforeUpdate, updateContext)

  return {
    data: result.data,
    where: result.where,
    previousData: result.previousData,
  }
}

/**
 * Run delete operation hooks
 */
export const runDeleteHooks = async <
  TSlug extends string,
  TFields extends Record<string, Field<unknown>>,
>(
  hooks: CollectionHooks<TSlug, TFields>,
  where: Record<string, unknown>,
  previousData: InferFieldTypes<TFields>
): Promise<{
  where: Record<string, unknown>
  previousData: InferFieldTypes<TFields>
}> => {
  const baseContext: BaseHookContext<TSlug> = {
    collection: '' as TSlug,
    operation: 'delete',
  }

  // beforeOperation
  const ctx = await executeBeforeOperation(hooks, baseContext)

  // Delete context
  const deleteContext: DeleteHookContext<TSlug, TFields> = {
    ...ctx,
    operation: 'delete',
    where,
    previousData,
  }

  // beforeDelete
  const result = await executeHook(hooks.beforeDelete, deleteContext)

  return {
    where: result.where,
    previousData: result.previousData,
  }
}
