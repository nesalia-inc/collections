import { describe, it, expect } from 'vitest'
import { collection, field, f, runCreateHooks, runReadHooks, runUpdateHooks, runDeleteHooks, createHookRunner } from '../src'

describe('collection hooks', () => {
  it('stores hooks on the collection object', () => {
    const beforeCreate = async (ctx: any) => ctx
    const afterCreate = async (ctx: any) => ctx

    const posts = collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text() }),
      },
      hooks: {
        beforeCreate,
        afterCreate,
      },
    })

    expect(posts.hooks.beforeCreate).toBe(beforeCreate)
    expect(posts.hooks.afterCreate).toBe(afterCreate)
  })

  it('defaults hooks to empty object when not provided', () => {
    const posts = collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text() }),
      },
    })

    expect(posts.hooks).toEqual({})
  })

  it('supports all 10 hook types', () => {
    const hooks = {
      beforeOperation: async (ctx: any) => ctx,
      afterOperation: async (ctx: any) => ctx,
      beforeCreate: async (ctx: any) => ctx,
      afterCreate: async (ctx: any) => ctx,
      beforeUpdate: async (ctx: any) => ctx,
      afterUpdate: async (ctx: any) => ctx,
      beforeDelete: async (ctx: any) => ctx,
      afterDelete: async (ctx: any) => ctx,
      beforeRead: async (ctx: any) => ctx,
      afterRead: async (ctx: any) => ctx,
    }

    const posts = collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text() }),
      },
      hooks,
    })

    expect(posts.hooks).toEqual(hooks)
  })
})

describe('runCreateHooks', () => {
  it('returns data unchanged when no hooks', async () => {
    const data = { title: 'Hello' }
    const result = await runCreateHooks('posts', {}, data)

    expect(result.data).toEqual(data)
    expect(result.stopped).toBe(false)
  })

  it('calls beforeCreate hook', async () => {
    const beforeCreate = async (ctx: any) => {
      ctx.data.title = 'Modified'
      return ctx
    }

    const data = { title: 'Hello' }
    const result = await runCreateHooks('posts', { beforeCreate }, data)

    expect(result.data.title).toBe('Modified')
  })

  it('can modify data in beforeCreate', async () => {
    const beforeCreate = async (ctx: any) => {
      ctx.data.slug = 'auto-generated-slug'
      return ctx
    }

    const data = { title: 'Hello' }
    const result = await runCreateHooks('posts', { beforeCreate }, data)

    expect(result.data.slug).toBe('auto-generated-slug')
    expect(result.data.title).toBe('Hello')
  })

  it('supports sync hook return', async () => {
    const beforeCreate = (ctx: any) => {
      ctx.data.title = 'Sync Modified'
      return ctx
    }

    const data = { title: 'Hello' }
    const result = await runCreateHooks('posts', { beforeCreate }, data)

    expect(result.data.title).toBe('Sync Modified')
  })

  it('supports _stop early exit', async () => {
    const beforeCreate = async (ctx: any) => {
      return { _stop: true, data: ctx }
    }

    const data = { title: 'Hello' }
    const result = await runCreateHooks('posts', { beforeCreate }, data)

    expect(result.stopped).toBe(true)
  })
})

describe('runReadHooks', () => {
  it('returns query unchanged when no hooks', async () => {
    const query = { where: { published: true } }
    const result = await runReadHooks('posts', {}, query)

    expect(result.query).toEqual(query)
    expect(result.stopped).toBe(false)
  })

  it('calls beforeRead hook', async () => {
    const beforeRead = async (ctx: any) => {
      ctx.query.limit = 10
      return ctx
    }

    const query = { where: { published: true } }
    const result = await runReadHooks('posts', { beforeRead }, query)

    expect(result.query.limit).toBe(10)
  })

  it('can modify query in beforeRead', async () => {
    const beforeRead = async (ctx: any) => {
      ctx.query.where.draft = false
      return ctx
    }

    const query = { where: { published: true } }
    const result = await runReadHooks('posts', { beforeRead }, query)

    expect(result.query.where.draft).toBe(false)
  })

  it('supports _stop early exit', async () => {
    const beforeRead = async (ctx: any) => {
      return { _stop: true, data: ctx }
    }

    const query = { where: { published: true } }
    const result = await runReadHooks('posts', { beforeRead }, query)

    expect(result.stopped).toBe(true)
  })
})

describe('runUpdateHooks', () => {
  it('returns all params unchanged when no hooks', async () => {
    const data = { title: 'New Title' }
    const where = { id: '123' }
    const previousData = { id: '123', title: 'Old Title' }

    const result = await runUpdateHooks('posts', {}, data, where, previousData)

    expect(result.data).toEqual(data)
    expect(result.where).toEqual(where)
    expect(result.previousData).toEqual(previousData)
    expect(result.stopped).toBe(false)
  })

  it('calls beforeUpdate hook', async () => {
    const beforeUpdate = async (ctx: any) => {
      ctx.data.updatedAt = new Date().toISOString()
      return ctx
    }

    const data = { title: 'New Title' }
    const where = { id: '123' }
    const previousData = { id: '123', title: 'Old Title' }

    const result = await runUpdateHooks('posts', { beforeUpdate }, data, where, previousData)

    expect(result.data.updatedAt).toBeDefined()
  })

  it('can modify data in beforeUpdate', async () => {
    const beforeUpdate = async (ctx: any) => {
      ctx.data.modifiedBy = 'system'
      return ctx
    }

    const data = { title: 'New Title' }
    const result = await runUpdateHooks('posts', { beforeUpdate }, data, {}, {})

    expect(result.data.modifiedBy).toBe('system')
  })

  it('supports _stop early exit', async () => {
    const beforeUpdate = async (ctx: any) => {
      return { _stop: true, data: ctx }
    }

    const result = await runUpdateHooks('posts', { beforeUpdate }, {}, {}, {})

    expect(result.stopped).toBe(true)
  })
})

describe('runDeleteHooks', () => {
  it('returns params unchanged when no hooks', async () => {
    const where = { id: '123' }
    const previousData = { id: '123', title: 'To Delete' }

    const result = await runDeleteHooks('posts', {}, where, previousData)

    expect(result.where).toEqual(where)
    expect(result.previousData).toEqual(previousData)
    expect(result.stopped).toBe(false)
  })

  it('calls beforeDelete hook', async () => {
    const beforeDelete = async (ctx: any) => {
      ctx.previousData.deletedAt = new Date().toISOString()
      return ctx
    }

    const where = { id: '123' }
    const previousData = { id: '123', title: 'To Delete' }

    const result = await runDeleteHooks('posts', { beforeDelete }, where, previousData)

    expect(result.previousData.deletedAt).toBeDefined()
  })

  it('can access previousData in beforeDelete', async () => {
    const beforeDelete = async (ctx: any) => {
      ctx.where.archived = true
      ctx.previousData.wasDeleted = true
      return ctx
    }

    const where = { id: '123' }
    const previousData = { id: '123', title: 'To Delete' }

    const result = await runDeleteHooks('posts', { beforeDelete }, where, previousData)

    expect(result.where.archived).toBe(true)
    expect(result.previousData.wasDeleted).toBe(true)
  })

  it('supports _stop early exit', async () => {
    const beforeDelete = async (ctx: any) => {
      return { _stop: true, data: ctx }
    }

    const result = await runDeleteHooks('posts', { beforeDelete }, {}, {})

    expect(result.stopped).toBe(true)
  })
})

describe('createHookRunner', () => {
  it('creates a runner bound to a slug', async () => {
    const runner = createHookRunner('posts', {})

    const result = await runner.runCreate({ title: 'Hello' })

    expect(result.data.title).toBe('Hello')
    expect(result.stopped).toBe(false)
  })

  it('runner executes beforeCreate from hooks', async () => {
    const beforeCreate = async (ctx: any) => {
      ctx.data.processed = true
      return ctx
    }

    const runner = createHookRunner('posts', { beforeCreate })

    const result = await runner.runCreate({ title: 'Hello' })

    expect(result.data.processed).toBe(true)
  })

  it('runner supports all operations', async () => {
    const runner = createHookRunner('posts', {})

    const createResult = await runner.runCreate({ title: 'Test' })
    expect(createResult.data.title).toBe('Test')

    const readResult = await runner.runRead({ limit: 10 })
    expect(readResult.query.limit).toBe(10)
  })
})
