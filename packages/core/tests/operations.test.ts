import { describe, it, expect, beforeEach } from 'vitest'
import { defineConfig, collection, field, f } from '../src'

describe('Collection Operations', () => {
  let config: ReturnType<typeof defineConfig>

  beforeEach(() => {
    const users = collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: f.text() }),
        email: field({ fieldType: f.text() }),
        age: field({ fieldType: f.number() })
      }
    })

    const posts = collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text() }),
        content: field({ fieldType: f.text() })
      }
    })

    config = defineConfig({
      database: { url: 'postgres://localhost:5432/db' },
      collections: [users, posts]
    })
  })

  describe('collections have operations', () => {
    it('users collection has findMany', () => {
      expect(config.collections.users.findMany).toBeDefined()
      expect(typeof config.collections.users.findMany).toBe('function')
    })

    it('users collection has findUnique', () => {
      expect(config.collections.users.findUnique).toBeDefined()
      expect(typeof config.collections.users.findUnique).toBe('function')
    })

    it('users collection has findFirst', () => {
      expect(config.collections.users.findFirst).toBeDefined()
      expect(typeof config.collections.users.findFirst).toBe('function')
    })

    it('users collection has create', () => {
      expect(config.collections.users.create).toBeDefined()
      expect(typeof config.collections.users.create).toBe('function')
    })

    it('users collection has createMany', () => {
      expect(config.collections.users.createMany).toBeDefined()
      expect(typeof config.collections.users.createMany).toBe('function')
    })

    it('users collection has update', () => {
      expect(config.collections.users.update).toBeDefined()
      expect(typeof config.collections.users.update).toBe('function')
    })

    it('users collection has updateMany', () => {
      expect(config.collections.users.updateMany).toBeDefined()
      expect(typeof config.collections.users.updateMany).toBe('function')
    })

    it('users collection has delete', () => {
      expect(config.collections.users.delete).toBeDefined()
      expect(typeof config.collections.users.delete).toBe('function')
    })

    it('users collection has deleteMany', () => {
      expect(config.collections.users.deleteMany).toBeDefined()
      expect(typeof config.collections.users.deleteMany).toBe('function')
    })

    it('users collection has count', () => {
      expect(config.collections.users.count).toBeDefined()
      expect(typeof config.collections.users.count).toBe('function')
    })

    it('users collection has exists', () => {
      expect(config.collections.users.exists).toBeDefined()
      expect(typeof config.collections.users.exists).toBe('function')
    })
  })

  describe('findMany returns array', () => {
    it('findMany returns empty array by default', async () => {
      const result = await config.collections.users.findMany()
      expect(result).toEqual([])
    })

    it('findMany accepts where option', async () => {
      const result = await config.collections.users.findMany({
        where: { email: 'test@example.com' }
      })
      expect(result).toEqual([])
    })

    it('findMany accepts orderBy option', async () => {
      const result = await config.collections.users.findMany({
        orderBy: { createdAt: 'desc' }
      })
      expect(result).toEqual([])
    })

    it('findMany accepts limit option', async () => {
      const result = await config.collections.users.findMany({
        limit: 10
      })
      expect(result).toEqual([])
    })

    it('findMany accepts offset option', async () => {
      const result = await config.collections.users.findMany({
        offset: 5
      })
      expect(result).toEqual([])
    })

    it('findMany accepts multiple options', async () => {
      const result = await config.collections.users.findMany({
        where: { age: { gt: 18 } },
        orderBy: { name: 'asc' },
        limit: 10,
        offset: 0
      })
      expect(result).toEqual([])
    })
  })

  describe('findUnique returns undefined', () => {
    it('findUnique returns undefined', async () => {
      const result = await config.collections.users.findUnique({
        where: { id: 1 }
      })
      expect(result).toBeUndefined()
    })

    it('findUnique accepts select option', async () => {
      const result = await config.collections.users.findUnique({
        where: { id: 1 },
        select: { name: true, email: true }
      })
      expect(result).toBeUndefined()
    })
  })

  describe('findFirst returns undefined', () => {
    it('findFirst returns undefined', async () => {
      const result = await config.collections.users.findFirst({
        where: { email: 'test@example.com' }
      })
      expect(result).toBeUndefined()
    })

    it('findFirst accepts orderBy option', async () => {
      const result = await config.collections.users.findFirst({
        where: { age: { gt: 18 } },
        orderBy: { name: 'asc' }
      })
      expect(result).toBeUndefined()
    })
  })

  describe('create returns undefined', () => {
    it('create returns undefined', async () => {
      const result = await config.collections.users.create({
        data: { name: 'John', email: 'john@example.com' }
      })
      expect(result).toBeUndefined()
    })

    it('create with returning returns undefined', async () => {
      const result = await config.collections.users.create({
        data: { name: 'John' },
        returning: true
      })
      expect(result).toBeUndefined()
    })
  })

  describe('createMany returns number', () => {
    it('createMany returns 0', async () => {
      const result = await config.collections.users.createMany({
        data: [
          { name: 'John', email: 'john@example.com' },
          { name: 'Jane', email: 'jane@example.com' }
        ]
      })
      expect(result).toBe(0)
    })
  })

  describe('update returns undefined', () => {
    it('update returns undefined', async () => {
      const result = await config.collections.users.update({
        where: { id: 1 },
        data: { name: 'Jane' }
      })
      expect(result).toBeUndefined()
    })

    it('update with returning returns undefined', async () => {
      const result = await config.collections.users.update({
        where: { id: 1 },
        data: { name: 'Jane' },
        returning: true
      })
      expect(result).toBeUndefined()
    })
  })

  describe('updateMany returns number', () => {
    it('updateMany returns 0', async () => {
      const result = await config.collections.users.updateMany({
        where: { status: 'draft' },
        data: { status: 'published' }
      })
      expect(result).toBe(0)
    })
  })

  describe('delete returns undefined', () => {
    it('delete returns undefined', async () => {
      const result = await config.collections.users.delete({
        where: { id: 1 }
      })
      expect(result).toBeUndefined()
    })

    it('delete with returning returns undefined', async () => {
      const result = await config.collections.users.delete({
        where: { id: 1 },
        returning: true
      })
      expect(result).toBeUndefined()
    })
  })

  describe('deleteMany returns number', () => {
    it('deleteMany returns 0', async () => {
      const result = await config.collections.users.deleteMany({
        where: { status: 'archived' }
      })
      expect(result).toBe(0)
    })
  })

  describe('count returns number', () => {
    it('count returns 0', async () => {
      const result = await config.collections.users.count()
      expect(result).toBe(0)
    })

    it('count accepts where option', async () => {
      const result = await config.collections.users.count({
        where: { email: 'test@example.com' }
      })
      expect(result).toBe(0)
    })
  })

  describe('exists returns boolean', () => {
    it('exists returns false', async () => {
      const result = await config.collections.users.exists({
        where: { email: 'test@example.com' }
      })
      expect(result).toBe(false)
    })
  })

  describe('multiple collections', () => {
    it('posts collection has all operations', () => {
      expect(config.collections.posts.findMany).toBeDefined()
      expect(config.collections.posts.findUnique).toBeDefined()
      expect(config.collections.posts.create).toBeDefined()
      expect(config.collections.posts.update).toBeDefined()
      expect(config.collections.posts.delete).toBeDefined()
    })

    it('can call operations on different collections', async () => {
      const usersResult = await config.collections.users.findMany()
      const postsResult = await config.collections.posts.findMany()

      expect(usersResult).toEqual([])
      expect(postsResult).toEqual([])
    })
  })
})
