import { describe, it, expect } from 'vitest'
import { collection, field, f, runCreateHooks, runReadHooks, runUpdateHooks, runDeleteHooks } from '../src'

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
    const result = await runCreateHooks({}, data)

    expect(result.data).toEqual(data)
  })

  it('calls beforeCreate hook', async () => {
    const beforeCreate = async (ctx: any) => {
      ctx.data.title = 'Modified'
      return ctx
    }

    const data = { title: 'Hello' }
    const result = await runCreateHooks({ beforeCreate }, data)

    expect(result.data.title).toBe('Modified')
  })

  it('can modify data in beforeCreate', async () => {
    const beforeCreate = async (ctx: any) => {
      ctx.data.slug = 'auto-generated-slug'
      return ctx
    }

    const data = { title: 'Hello' }
    const result = await runCreateHooks({ beforeCreate }, data)

    expect(result.data.slug).toBe('auto-generated-slug')
    expect(result.data.title).toBe('Hello')
  })

  it('supports sync hook return', async () => {
    const beforeCreate = (ctx: any) => {
      ctx.data.title = 'Sync Modified'
      return ctx
    }

    const data = { title: 'Hello' }
    const result = await runCreateHooks({ beforeCreate }, data)

    expect(result.data.title).toBe('Sync Modified')
  })
})

describe('runReadHooks', () => {
  it('returns query unchanged when no hooks', async () => {
    const query = { where: { published: true } }
    const result = await runReadHooks({}, query)

    expect(result.query).toEqual(query)
  })

  it('calls beforeRead hook', async () => {
    const beforeRead = async (ctx: any) => {
      ctx.query.limit = 10
      return ctx
    }

    const query = { where: { published: true } }
    const result = await runReadHooks({ beforeRead }, query)

    expect(result.query.limit).toBe(10)
  })

  it('can modify query in beforeRead', async () => {
    const beforeRead = async (ctx: any) => {
      ctx.query.where.draft = false
      return ctx
    }

    const query = { where: { published: true } }
    const result = await runReadHooks({ beforeRead }, query)

    expect(result.query.where.draft).toBe(false)
  })
})

describe('runUpdateHooks', () => {
  it('returns all params unchanged when no hooks', async () => {
    const data = { title: 'New Title' }
    const where = { id: '123' }
    const previousData = { id: '123', title: 'Old Title' }

    const result = await runUpdateHooks({}, data, where, previousData)

    expect(result.data).toEqual(data)
    expect(result.where).toEqual(where)
    expect(result.previousData).toEqual(previousData)
  })

  it('calls beforeUpdate hook', async () => {
    const beforeUpdate = async (ctx: any) => {
      ctx.data.updatedAt = new Date().toISOString()
      return ctx
    }

    const data = { title: 'New Title' }
    const where = { id: '123' }
    const previousData = { id: '123', title: 'Old Title' }

    const result = await runUpdateHooks({ beforeUpdate }, data, where, previousData)

    expect(result.data.updatedAt).toBeDefined()
  })

  it('can modify data in beforeUpdate', async () => {
    const beforeUpdate = async (ctx: any) => {
      ctx.data.modifiedBy = 'system'
      return ctx
    }

    const data = { title: 'New Title' }
    const result = await runUpdateHooks({ beforeUpdate }, data, {}, {})

    expect(result.data.modifiedBy).toBe('system')
  })
})

describe('runDeleteHooks', () => {
  it('returns params unchanged when no hooks', async () => {
    const where = { id: '123' }
    const previousData = { id: '123', title: 'To Delete' }

    const result = await runDeleteHooks({}, where, previousData)

    expect(result.where).toEqual(where)
    expect(result.previousData).toEqual(previousData)
  })

  it('calls beforeDelete hook', async () => {
    const beforeDelete = async (ctx: any) => {
      ctx.previousData.deletedAt = new Date().toISOString()
      return ctx
    }

    const where = { id: '123' }
    const previousData = { id: '123', title: 'To Delete' }

    const result = await runDeleteHooks({ beforeDelete }, where, previousData)

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

    const result = await runDeleteHooks({ beforeDelete }, where, previousData)

    expect(result.where.archived).toBe(true)
    expect(result.previousData.wasDeleted).toBe(true)
  })
})
