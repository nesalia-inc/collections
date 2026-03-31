// Hook executor helper functions

import type {
  CollectionHooks,
  HookHandler,
  BaseHookContext,
} from '../types'

/**
 * Execute a hook handler, allowing both sync and async return
 */
export const executeHook = async <T extends BaseHookContext>(
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
export const executeBeforeOperation = async (
  hooks: CollectionHooks,
  context: BaseHookContext
): Promise<BaseHookContext> => {
  const ctx = await executeHook(hooks.beforeOperation, context)
  return ctx
}
