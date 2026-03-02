import { describe, it, expect } from 'vitest'
import { defineConfig, collection, field, f, pgAdapter } from '../src'

describe('Collections - Metadata Only', () => {
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

      // Collections returns metadata only
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

    it('collections does NOT have operations', () => {
      const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })
      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: adapter,
        collections: [users]
      })

      // Collections should only have metadata, not operations
      expect(config.collections.users.findMany).toBeUndefined()
      expect(config.collections.users.create).toBeUndefined()
      expect(config.collections.users.update).toBeUndefined()
      expect(config.collections.users.delete).toBeUndefined()
    })
  })
})

describe('DB - Drizzle Instance', () => {
  describe('db is Drizzle instance with operations', () => {
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

    it('db has tables from collections', () => {
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

      // db should have the tables from schema
      expect(config.db).toBeDefined()
    })
  })
})

describe('$meta', () => {
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

    expect(config.$meta.plugins).toContain('test-plugin')
  })
})

describe('Multiple Collections', () => {
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

    // All collections should be accessible (metadata only)
    expect(config.collections.users).toBeDefined()
    expect(config.collections.users.slug).toBe('users')
    expect(config.collections.posts).toBeDefined()
    expect(config.collections.posts.slug).toBe('posts')
    expect(config.collections.comments).toBeDefined()
    expect(config.collections.comments.slug).toBe('comments')

    // No operations on collections
    expect(config.collections.users.findMany).toBeUndefined()
  })
})
