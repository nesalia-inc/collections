import { describe, it, expect } from 'vitest'
import { defineConfig, collection, field, f, pgAdapter } from '../src'

describe('Collection Metadata', () => {
  describe('collections return metadata (slug, name, fields)', () => {
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

      expect(config.collections.users.slug).toBe('users')
      expect(config.collections.users.name).toBe('Users')
      expect(config.collections.users.fields).toBeDefined()
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

      expect(config.collections.users.fields.name).toBeDefined()
      expect(config.collections.users.fields.email).toBeDefined()
    })

    it('preserves collection slug and name', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
      const users = collection({
        slug: 'users',
        name: 'Users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: adapter,
        collections: [users]
      })

      expect(config.collections.users.slug).toBe('users')
      expect(config.collections.users.name).toBe('Users')
    })
  })

  describe('collections do NOT have operations', () => {
    it('collections does NOT have findMany, create, update, delete', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: adapter,
        collections: [users]
      })

      expect(config.collections.users.findMany).toBeUndefined()
      expect(config.collections.users.create).toBeUndefined()
      expect(config.collections.users.update).toBeUndefined()
      expect(config.collections.users.delete).toBeUndefined()
    })
  })

  describe('multiple collections metadata', () => {
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

      expect(config.collections.users).toBeDefined()
      expect(config.collections.users.slug).toBe('users')
      expect(config.collections.posts).toBeDefined()
      expect(config.collections.posts.slug).toBe('posts')
      expect(config.collections.comments).toBeDefined()
      expect(config.collections.comments.slug).toBe('comments')
    })

    it('can access different collections metadata', () => {
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

      expect(config.collections.users.slug).toBe('users')
      expect(config.collections.posts.slug).toBe('posts')
    })
  })

  describe('$meta collections tracking', () => {
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

      expect(config.$meta.collections).toContain('users')
      expect(config.$meta.collections).toContain('posts')
      expect(config.$meta.collections).toHaveLength(2)
    })

    it('$meta.plugins is array of plugin names', () => {
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

      expect(config.$meta.plugins).toContain('test-plugin')
    })

    it('tracks plugin collections correctly', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })

      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const mockPlugin1 = {
        name: 'plugin-1',
        collections: {
          plugin1Table: collection({
            slug: 'plugin1Table',
            fields: { data: field({ fieldType: f.text() }) }
          })
        }
      }

      const mockPlugin2 = {
        name: 'plugin-2',
        collections: {
          plugin2Table: collection({
            slug: 'plugin2Table',
            fields: { value: field({ fieldType: f.text() }) }
          })
        }
      }

      const config = defineConfig({
        database: adapter,
        collections: [users],
        plugins: [mockPlugin1, mockPlugin2]
      })

      expect(config.$meta.collections).toHaveLength(3)
      expect(config.$meta.plugins).toHaveLength(2)
      expect(config.$meta.plugins).toContain('plugin-1')
      expect(config.$meta.plugins).toContain('plugin-2')
    })

    it('works with empty collections array', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
      const config = defineConfig({
        database: adapter,
        collections: []
      })

      expect(Object.keys(config.collections)).toHaveLength(0)
      expect(config.$meta.collections).toHaveLength(0)
    })
  })
})

describe('DB Instance', () => {
  describe('db is Drizzle instance', () => {
    it('db is defined', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: adapter,
        collections: [users]
      })

      expect(config.db).toBeDefined()
      expect(config.db).not.toBeNull()
    })
  })
})
