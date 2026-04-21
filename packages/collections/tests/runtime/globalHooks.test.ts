import { describe, it, expect } from 'vitest'
import { mergeHooks } from '../../src/runtime/types'
import type { CollectionHooks, CreateHookContext } from '../../src/collections/hooks/types'

describe('GlobalHooks', () => {
  describe('mergeHooks', () => {
    it('merges global and collection beforeCreate hooks - global runs first', async () => {
      const globalBeforeCreate = async (ctx: any) => {
        ctx.globalRan = true
        return ctx
      }

      const collectionBeforeCreate = async (ctx: any) => {
        ctx.collectionRan = true
        return ctx
      }

      const collectionHooks: CollectionHooks = {
        beforeCreate: collectionBeforeCreate,
      }

      const globalHooks = {
        beforeCreate: globalBeforeCreate,
      }

      const merged = mergeHooks(collectionHooks, globalHooks)

      const ctx = { collection: 'posts', operation: 'create' as const, data: {} }
      const result = await merged.beforeCreate!(ctx)

      expect(result.globalRan).toBe(true)
      expect(result.collectionRan).toBe(true)
    })

    it('passes context through hook chain', async () => {
      const globalBeforeCreate = async (ctx: any) => {
        ctx.globalModified = 'global'
        return ctx
      }

      const collectionBeforeCreate = async (ctx: any) => {
        ctx.collectionModified = 'collection'
        return ctx
      }

      const merged = mergeHooks(
        { beforeCreate: collectionBeforeCreate },
        { beforeCreate: globalBeforeCreate }
      )

      const ctx = { collection: 'posts', operation: 'create' as const, data: {} }
      const result = await merged.beforeCreate!(ctx)

      expect(result.globalModified).toBe('global')
      expect(result.collectionModified).toBe('collection')
    })

    it('works with undefined collection hooks', async () => {
      const globalBeforeCreate = async (ctx: any) => {
        ctx.globalRan = true
        return ctx
      }

      const merged = mergeHooks(undefined, { beforeCreate: globalBeforeCreate })

      const ctx = { collection: 'posts', operation: 'create' as const, data: {} }
      const result = await merged.beforeCreate!(ctx)

      expect(result.globalRan).toBe(true)
    })

    it('works with undefined globalHooks', async () => {
      const collectionBeforeCreate = async (ctx: any) => {
        ctx.collectionRan = true
        return ctx
      }

      const merged = mergeHooks(
        { beforeCreate: collectionBeforeCreate },
        undefined
      )

      const ctx = { collection: 'posts', operation: 'create' as const, data: {} }
      const result = await merged.beforeCreate!(ctx)

      expect(result.collectionRan).toBe(true)
    })

    it('works when both are undefined', async () => {
      const merged = mergeHooks(undefined, undefined)

      const ctx = { collection: 'posts', operation: 'create' as const, data: {} }
      const result = await merged.beforeCreate!(ctx)

      expect(result).toBe(ctx)
    })

    it('merges all hook types (beforeUpdate, afterUpdate, beforeDelete, afterDelete)', async () => {
      const globalHooks = {
        beforeCreate: async (ctx: any) => { ctx.gBeforeCreate = true; return ctx },
        afterCreate: async (ctx: any) => { ctx.gAfterCreate = true; return ctx },
        beforeUpdate: async (ctx: any) => { ctx.gBeforeUpdate = true; return ctx },
        afterUpdate: async (ctx: any) => { ctx.gAfterUpdate = true; return ctx },
        beforeDelete: async (ctx: any) => { ctx.gBeforeDelete = true; return ctx },
        afterDelete: async (ctx: any) => { ctx.gAfterDelete = true; return ctx },
      }

      const collectionHooks: CollectionHooks = {
        beforeCreate: async (ctx: any) => { ctx.cBeforeCreate = true; return ctx },
        afterCreate: async (ctx: any) => { ctx.cAfterCreate = true; return ctx },
        beforeUpdate: async (ctx: any) => { ctx.cBeforeUpdate = true; return ctx },
        afterUpdate: async (ctx: any) => { ctx.cAfterUpdate = true; return ctx },
        beforeDelete: async (ctx: any) => { ctx.cBeforeDelete = true; return ctx },
        afterDelete: async (ctx: any) => { ctx.cAfterDelete = true; return ctx },
      }

      const merged = mergeHooks(collectionHooks, globalHooks)

      const createCtx = { collection: 'posts', operation: 'create' as const, data: {} }
      const createResult = await merged.beforeCreate!(createCtx)
      expect(createResult.gBeforeCreate).toBe(true)
      expect(createResult.cBeforeCreate).toBe(true)

      const updateCtx = { collection: 'posts', operation: 'update' as const, data: {}, where: {}, previousData: {} }
      const updateResult = await merged.beforeUpdate!(updateCtx)
      expect(updateResult.gBeforeUpdate).toBe(true)
      expect(updateResult.cBeforeUpdate).toBe(true)

      const deleteCtx = { collection: 'posts', operation: 'delete' as const, where: {}, previousData: {} }
      const deleteResult = await merged.beforeDelete!(deleteCtx)
      expect(deleteResult.gBeforeDelete).toBe(true)
      expect(deleteResult.cBeforeDelete).toBe(true)
    })

    it('collection hook receives modified context from global hook', async () => {
      const globalBeforeCreate = async (ctx: any) => {
        ctx.data.title = 'Modified by Global'
        return ctx
      }

      const collectionBeforeCreate = async (ctx: any) => {
        // Collection should receive the context modified by global
        ctx.data.title = ctx.data.title + ' + Collection'
        return ctx
      }

      const merged = mergeHooks(
        { beforeCreate: collectionBeforeCreate },
        { beforeCreate: globalBeforeCreate }
      )

      const ctx = { collection: 'posts', operation: 'create' as const, data: { title: 'Original' } }
      const result = await merged.beforeCreate!(ctx)

      expect(result.data.title).toBe('Modified by Global + Collection')
    })

    it('after hooks also receive context from global hooks', async () => {
      const globalAfterCreate = async (ctx: any) => {
        ctx.globalAfterRan = true
        return ctx
      }

      const collectionAfterCreate = async (ctx: any) => {
        ctx.collectionAfterRan = true
        return ctx
      }

      const merged = mergeHooks(
        { afterCreate: collectionAfterCreate },
        { afterCreate: globalAfterCreate }
      )

      const ctx = { collection: 'posts', operation: 'create' as const, data: {} }
      const result = await merged.afterCreate!(ctx)

      expect(result.globalAfterRan).toBe(true)
      expect(result.collectionAfterRan).toBe(true)
    })

    it('supports sync hook return', async () => {
      const globalBeforeCreate = (ctx: any) => {
        ctx.globalRan = true
        return ctx
      }

      const collectionBeforeCreate = (ctx: any) => {
        ctx.collectionRan = true
        return ctx
      }

      const merged = mergeHooks(
        { beforeCreate: collectionBeforeCreate },
        { beforeCreate: globalBeforeCreate }
      )

      const ctx = { collection: 'posts', operation: 'create' as const, data: {} }
      const result = await merged.beforeCreate!(ctx)

      expect(result.globalRan).toBe(true)
      expect(result.collectionRan).toBe(true)
    })
  })
})
