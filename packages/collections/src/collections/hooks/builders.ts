// Hook executor builders - run*Hooks functions

import type {
  CollectionHooks,
  BaseHookContext,
  CreateHookContext,
  ReadHookContext,
  UpdateHookContext,
  DeleteHookContext,
} from '../types'

import { executeHook, executeBeforeOperation } from './types'

/**
 * Run create operation hooks
 */
export const runCreateHooks = async (
  hooks: CollectionHooks,
  data: Record<string, unknown>
): Promise<{ data: Record<string, unknown> }> => {
  const baseContext: BaseHookContext = {
    collection: '', // Set by caller
    operation: 'create',
  }

  // beforeOperation
  const ctx = await executeBeforeOperation(hooks, baseContext)

  // Create context
  const createContext: CreateHookContext = {
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
export const runReadHooks = async (
  hooks: CollectionHooks,
  query: Record<string, unknown>
): Promise<{ query: Record<string, unknown> }> => {
  const baseContext: BaseHookContext = {
    collection: '',
    operation: 'read',
  }

  // beforeOperation
  const ctx = await executeBeforeOperation(hooks, baseContext)

  // Read context
  const readContext: ReadHookContext = {
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
export const runUpdateHooks = async (
  hooks: CollectionHooks,
  data: Record<string, unknown>,
  where: Record<string, unknown>,
  previousData: Record<string, unknown>
): Promise<{
  data: Record<string, unknown>
  where: Record<string, unknown>
  previousData: Record<string, unknown>
}> => {
  const baseContext: BaseHookContext = {
    collection: '',
    operation: 'update',
  }

  // beforeOperation
  const ctx = await executeBeforeOperation(hooks, baseContext)

  // Update context
  const updateContext: UpdateHookContext = {
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
export const runDeleteHooks = async (
  hooks: CollectionHooks,
  where: Record<string, unknown>,
  previousData: Record<string, unknown>
): Promise<{
  where: Record<string, unknown>
  previousData: Record<string, unknown>
}> => {
  const baseContext: BaseHookContext = {
    collection: '',
    operation: 'delete',
  }

  // beforeOperation
  const ctx = await executeBeforeOperation(hooks, baseContext)

  // Delete context
  const deleteContext: DeleteHookContext = {
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
