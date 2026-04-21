// Runtime types for createCollections

import type {
  CollectionHooks,
  CreateHookContext,
  UpdateHookContext,
  DeleteHookContext,
} from '../collections/hooks/types'

// ============================================================================
// GlobalHook Types
// ============================================================================

/**
 * Result type for global hook handlers
 * Can return the (potentially modified) context, or stop execution with data
 * @typeParam T - The context type
 */
export type GlobalHookResult<T = unknown> = T | { stopped: true; data: T }

/**
 * Global hook handler function type
 * @typeParam T - The context type
 * @param context - The hook context (varies by operation)
 * @returns The context (potentially modified) or { stopped: true, data } to stop execution
 */
export type GlobalHookHandler<T = unknown> = (context: T) => GlobalHookResult<T>

// ============================================================================
// GlobalHooks
// ============================================================================

/**
 * Global hooks applied to all collections
 * These are merged with each collection's own hooks
 * Global hooks run BEFORE collection hooks
 */
export type GlobalHooks = {
  beforeCreate?: (context: CreateHookContext) => GlobalHookResult<CreateHookContext>
  afterCreate?: (context: CreateHookContext) => GlobalHookResult<CreateHookContext>
  beforeUpdate?: (context: UpdateHookContext) => GlobalHookResult<UpdateHookContext>
  afterUpdate?: (context: UpdateHookContext) => GlobalHookResult<UpdateHookContext>
  beforeDelete?: (context: DeleteHookContext) => GlobalHookResult<DeleteHookContext>
  afterDelete?: (context: DeleteHookContext) => GlobalHookResult<DeleteHookContext>
}

// ============================================================================
// Hook Merging
// ============================================================================

/**
 * Merges global hooks with collection-specific hooks
 * Global hooks execute first, then collection hooks
 * The context returned by global hooks is passed to collection hooks
 */
export const mergeHooks = (
  collectionHooks: CollectionHooks | undefined,
  globalHooks: GlobalHooks | undefined
): CollectionHooks => {
  return {
    beforeCreate: async (ctx: CreateHookContext) => {
      const globalCtx = globalHooks?.beforeCreate
        ? await globalHooks.beforeCreate(ctx)
        : ctx
      // Handle stopped pattern - extract data from stopped result
      if (globalCtx && typeof globalCtx === 'object' && 'stopped' in globalCtx) {
        return (globalCtx as unknown as { data: CreateHookContext }).data
      }
      return collectionHooks?.beforeCreate
        ? await collectionHooks.beforeCreate(globalCtx)
        : globalCtx
    },
    afterCreate: async (ctx: CreateHookContext) => {
      const globalCtx = globalHooks?.afterCreate
        ? await globalHooks.afterCreate(ctx)
        : ctx
      if (globalCtx && typeof globalCtx === 'object' && 'stopped' in globalCtx) {
        return (globalCtx as unknown as { data: CreateHookContext }).data
      }
      return collectionHooks?.afterCreate
        ? await collectionHooks.afterCreate(globalCtx)
        : globalCtx
    },
    beforeUpdate: async (ctx: UpdateHookContext) => {
      const globalCtx = globalHooks?.beforeUpdate
        ? await globalHooks.beforeUpdate(ctx)
        : ctx
      if (globalCtx && typeof globalCtx === 'object' && 'stopped' in globalCtx) {
        return (globalCtx as unknown as { data: UpdateHookContext }).data
      }
      return collectionHooks?.beforeUpdate
        ? await collectionHooks.beforeUpdate(globalCtx)
        : globalCtx
    },
    afterUpdate: async (ctx: UpdateHookContext) => {
      const globalCtx = globalHooks?.afterUpdate
        ? await globalHooks.afterUpdate(ctx)
        : ctx
      if (globalCtx && typeof globalCtx === 'object' && 'stopped' in globalCtx) {
        return (globalCtx as unknown as { data: UpdateHookContext }).data
      }
      return collectionHooks?.afterUpdate
        ? await collectionHooks.afterUpdate(globalCtx)
        : globalCtx
    },
    beforeDelete: async (ctx: DeleteHookContext) => {
      const globalCtx = globalHooks?.beforeDelete
        ? await globalHooks.beforeDelete(ctx)
        : ctx
      if (globalCtx && typeof globalCtx === 'object' && 'stopped' in globalCtx) {
        return (globalCtx as unknown as { data: DeleteHookContext }).data
      }
      return collectionHooks?.beforeDelete
        ? await collectionHooks.beforeDelete(globalCtx)
        : globalCtx
    },
    afterDelete: async (ctx: DeleteHookContext) => {
      const globalCtx = globalHooks?.afterDelete
        ? await globalHooks.afterDelete(ctx)
        : ctx
      if (globalCtx && typeof globalCtx === 'object' && 'stopped' in globalCtx) {
        return (globalCtx as unknown as { data: DeleteHookContext }).data
      }
      return collectionHooks?.afterDelete
        ? await collectionHooks.afterDelete(globalCtx)
        : globalCtx
    },
  }
}
