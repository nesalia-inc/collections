// Hook runner - factory for running hooks with a collection's slug

import type { Field } from '../../fields'
import { lift, pipe } from './internal'
import type {
  CollectionHooks,
  CreateHookContext,
  ReadHookContext,
  UpdateHookContext,
  DeleteHookContext,
  InferFieldTypes,
} from './types'

// ============================================================================
// Types
// ============================================================================

/**
 * Result of running hooks - includes stopped flag for early exit detection
 */
export type HookResult<T> = T & { readonly stopped: boolean }

// ============================================================================
// Hook Runners
// ============================================================================

/**
 * Run create operation hooks
 */
export const runCreateHooks = async <
  TSlug extends string,
  TFields extends Record<string, Field<unknown>>,
>(
  slug: TSlug,
  hooks: CollectionHooks<TSlug, TFields>,
  data: Partial<InferFieldTypes<TFields>>
): Promise<HookResult<{ data: Partial<InferFieldTypes<TFields>> }>> => {
  const ctx: CreateHookContext<TSlug, TFields> = {
    collection: slug,
    operation: 'create',
    data,
  }

  const pipeline = pipe<CreateHookContext<TSlug, TFields>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lift(hooks.beforeOperation as any),
    lift(hooks.beforeCreate)
  )

  const result = await pipeline(ctx)

  if (result._tag === 'Error') throw result.error

  return {
    data: result.context.data,
    stopped: result._tag === 'Stop',
  }
}

/**
 * Run read operation hooks
 */
export const runReadHooks = async <TSlug extends string>(
  slug: TSlug,
  hooks: CollectionHooks<TSlug>,
  query: Record<string, unknown>
): Promise<HookResult<{ query: Record<string, unknown> }>> => {
  const ctx: ReadHookContext<TSlug> = {
    collection: slug,
    operation: 'read',
    query,
  }

  const pipeline = pipe<ReadHookContext<TSlug>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lift(hooks.beforeOperation as any),
    lift(hooks.beforeRead)
  )

  const result = await pipeline(ctx)

  if (result._tag === 'Error') throw result.error

  return {
    query: result.context.query,
    stopped: result._tag === 'Stop',
  }
}

/**
 * Run update operation hooks
 */
export const runUpdateHooks = async <
  TSlug extends string,
  TFields extends Record<string, Field<unknown>>,
>(
  slug: TSlug,
  hooks: CollectionHooks<TSlug, TFields>,
  data: Partial<InferFieldTypes<TFields>>,
  where: Record<string, unknown>,
  previousData: InferFieldTypes<TFields>
): Promise<HookResult<{
  data: Partial<InferFieldTypes<TFields>>
  where: Record<string, unknown>
  previousData: InferFieldTypes<TFields>
}>> => {
  const ctx: UpdateHookContext<TSlug, TFields> = {
    collection: slug,
    operation: 'update',
    data,
    where,
    previousData,
  }

  const pipeline = pipe<UpdateHookContext<TSlug, TFields>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lift(hooks.beforeOperation as any),
    lift(hooks.beforeUpdate)
  )

  const result = await pipeline(ctx)

  if (result._tag === 'Error') throw result.error

  return {
    data: result.context.data,
    where: result.context.where,
    previousData: result.context.previousData,
    stopped: result._tag === 'Stop',
  }
}

/**
 * Run delete operation hooks
 */
export const runDeleteHooks = async <
  TSlug extends string,
  TFields extends Record<string, Field<unknown>>,
>(
  slug: TSlug,
  hooks: CollectionHooks<TSlug, TFields>,
  where: Record<string, unknown>,
  previousData: InferFieldTypes<TFields>
): Promise<HookResult<{
  where: Record<string, unknown>
  previousData: InferFieldTypes<TFields>
}>> => {
  const ctx: DeleteHookContext<TSlug, TFields> = {
    collection: slug,
    operation: 'delete',
    where,
    previousData,
  }

  const pipeline = pipe<DeleteHookContext<TSlug, TFields>>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lift(hooks.beforeOperation as any),
    lift(hooks.beforeDelete)
  )

  const result = await pipeline(ctx)

  if (result._tag === 'Error') throw result.error

  return {
    where: result.context.where,
    previousData: result.context.previousData,
    stopped: result._tag === 'Stop',
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a hook runner bound to a specific collection slug
 */
export const createHookRunner = <TSlug extends string>(
  slug: TSlug,
  hooks: CollectionHooks<TSlug>
) => {
  return {
    runCreate: <TFields extends Record<string, Field<unknown>>>(
      data: Partial<InferFieldTypes<TFields>>
    ) => runCreateHooks(slug, hooks as CollectionHooks<TSlug, TFields>, data),

    runRead: (
      query: Record<string, unknown>
    ) => runReadHooks(slug, hooks, query),

    runUpdate: <TFields extends Record<string, Field<unknown>>>(
      data: Partial<InferFieldTypes<TFields>>,
      where: Record<string, unknown>,
      previousData: InferFieldTypes<TFields>
    ) => runUpdateHooks(slug, hooks as CollectionHooks<TSlug, TFields>, data, where, previousData),

    runDelete: <TFields extends Record<string, Field<unknown>>>(
      where: Record<string, unknown>,
      previousData: InferFieldTypes<TFields>
    ) => runDeleteHooks(slug, hooks as CollectionHooks<TSlug, TFields>, where, previousData),
  }
}
