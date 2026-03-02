import { describe, it, expect } from 'vitest'
import { defineConfig, collection, field, f, pgAdapter } from '../src'
import type { CollectionWithOperations } from '../src/config'

describe('Type Testing - Collection Metadata', () => {
  describe('collection returns metadata (slug, name, fields)', () => {
    it('collections.users has slug property', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
      const users = collection({
        slug: 'users',
        name: 'Users',
        fields: {
          name: field({ fieldType: f.text() }),
          email: field({ fieldType: f.email() })
        }
      })

      const config = defineConfig({
        database: adapter,
        collections: [users]
      })

      // Runtime test
      expect(config.collections.users.slug).toBe('users')
    })

    it('collections.users has optional name property', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: adapter,
        collections: [users]
      })

      // name is optional, can be undefined
      expect(config.collections.users.name).toBeUndefined()
    })

    it('collections.users has fields property', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() }),
          email: field({ fieldType: f.email() })
        }
      })

      const config = defineConfig({
        database: adapter,
        collections: [users]
      })

      // Runtime test
      expect(config.collections.users.fields.name).toBeDefined()
      expect(config.collections.users.fields.email).toBeDefined()
    })
  })
})

describe('Type Testing - Operations', () => {
  describe('operations exist and have correct signatures', () => {
    it('all CRUD operations are functions', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: adapter,
        collections: [users]
      })

      // All operations should be functions at runtime
      expect(typeof config.collections.users.findMany).toBe('function')
      expect(typeof config.collections.users.findUnique).toBe('function')
      expect(typeof config.collections.users.findFirst).toBe('function')
      expect(typeof config.collections.users.create).toBe('function')
      expect(typeof config.collections.users.createMany).toBe('function')
      expect(typeof config.collections.users.update).toBe('function')
      expect(typeof config.collections.users.updateMany).toBe('function')
      expect(typeof config.collections.users.delete).toBe('function')
      expect(typeof config.collections.users.deleteMany).toBe('function')
      expect(typeof config.collections.users.count).toBe('function')
      expect(typeof config.collections.users.exists).toBe('function')
    })
  })
})

describe('Type Testing - CollectionWithOperations', () => {
  it('collection has both metadata and operations', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: f.text() }) }
    })

    const config = defineConfig({
      database: adapter,
      collections: [users]
    })

    // Should have metadata
    expect(config.collections.users.slug).toBe('users')
    // Should have operations
    expect(typeof config.collections.users.findMany).toBe('function')
    expect(typeof config.collections.users.create).toBe('function')
  })
})

describe('Type Testing - $meta', () => {
  it('$meta.collections is array of slugs', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: f.text() }) }
    })
    const posts = collection({
      slug: 'posts',
      fields: { title: field({ fieldType: f.text() }) }
    })

    const config = defineConfig({
      database: adapter,
      collections: [users, posts]
    })

    // Runtime test
    expect(config.$meta.collections).toContain('users')
    expect(config.$meta.collections).toContain('posts')
  })

  it('$meta.plugins is array of strings', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: f.text() }) }
    })

    const mockPlugin = {
      name: 'test-plugin',
      collections: {}
    }

    const config = defineConfig({
      database: adapter,
      collections: [users],
      plugins: [mockPlugin]
    })

    // Runtime test
    expect(config.$meta.plugins).toContain('test-plugin')
  })
})

describe('Type Testing - db instance', () => {
  it('db is Drizzle instance', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: f.text() }) }
    })

    const config = defineConfig({
      database: adapter,
      collections: [users]
    })

    // db should be defined
    expect(config.db).toBeDefined()
    // db should not be null
    expect(config.db).not.toBeNull()
  })
})

describe('Type Testing - Multiple Collections', () => {
  it('config.collections has correct keys for multiple collections', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: f.text() }) }
    })
    const posts = collection({
      slug: 'posts',
      fields: { title: field({ fieldType: f.text() }) }
    })
    const comments = collection({
      slug: 'comments',
      fields: { body: field({ fieldType: f.text() }) }
    })

    const config = defineConfig({
      database: adapter,
      collections: [users, posts, comments]
    })

    // All collections should be accessible
    expect(config.collections.users).toBeDefined()
    expect(config.collections.posts).toBeDefined()
    expect(config.collections.comments).toBeDefined()

    // Each should have operations
    expect(typeof config.collections.users.findMany).toBe('function')
    expect(typeof config.collections.posts.findMany).toBe('function')
    expect(typeof config.collections.comments.findMany).toBe('function')
  })
})
