import { describe, it, expect, beforeEach } from 'vitest'
import { defineConfig, collection, field, f, pgAdapter } from '../src'

describe('Collection Operations', () => {
  let config: ReturnType<typeof defineConfig>

  beforeEach(() => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })

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
      database: adapter,
      collections: [users, posts]
    })
  })

  describe('collections have metadata (NOT operations)', () => {
    it('users collection has slug', () => {
      expect(config.collections.users.slug).toBe('users')
    })

    it('users collection has fields', () => {
      expect(config.collections.users.fields).toBeDefined()
    })

    it('users collection does NOT have operations', () => {
      expect(config.collections.users.findMany).toBeUndefined()
      expect(config.collections.users.create).toBeUndefined()
      expect(config.collections.users.update).toBeUndefined()
      expect(config.collections.users.delete).toBeUndefined()
    })
  })

  describe('db is Drizzle instance', () => {
    it('db is defined', () => {
      expect(config.db).toBeDefined()
      expect(config.db).not.toBeNull()
    })
  })

  describe('multiple collections', () => {
    it('posts collection has metadata', () => {
      expect(config.collections.posts.slug).toBe('posts')
      expect(config.collections.posts.fields).toBeDefined()
    })

    it('can access different collections metadata', () => {
      expect(config.collections.users.slug).toBe('users')
      expect(config.collections.posts.slug).toBe('posts')
    })
  })
})
