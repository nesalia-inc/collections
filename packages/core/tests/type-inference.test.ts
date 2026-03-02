import { describe, it, expect } from 'vitest'
import { defineConfig, collection, field, f } from '../src'
import { testAdapter, testCollections } from './fixtures'

describe('Type Inference', () => {
  describe('collection slug inference', () => {
    it('infers users and posts as collection keys', () => {
      const config = defineConfig({
        database: testAdapter,
        collections: [testCollections.users, testCollections.posts]
      })

      // Type test: config.collections should have users and posts keys
      const _users = config.collections.users
      const _posts = config.collections.posts

      expect(_users).toBeDefined()
      expect(_posts).toBeDefined()
    })

    it('infers single collection slug', () => {
      const config = defineConfig({
        database: testAdapter,
        collections: [testCollections.users]
      })

      const _users = config.collections.users
      expect(_users).toBeDefined()
    })

    it('infers $meta.collections as array of slugs', () => {
      const config = defineConfig({
        database: testAdapter,
        collections: [testCollections.users, testCollections.posts]
      })

      // Type test: $meta.collections should be string[]
      const _meta: string[] = config.$meta.collections
      expect(_meta).toContain('users')
      expect(_meta).toContain('posts')
    })
  })

  describe('collections have metadata only', () => {
    it('collections have slug property', () => {
      const config = defineConfig({
        database: testAdapter,
        collections: [testCollections.users]
      })

      // Collections have metadata
      expect(config.collections.users.slug).toBe('users')
      expect(config.collections.users.fields).toBeDefined()
    })

    it('collections do NOT have operations', () => {
      const config = defineConfig({
        database: testAdapter,
        collections: [testCollections.users]
      })

      // Operations should not exist on collections
      expect(config.collections.users.findMany).toBeUndefined()
      expect(config.collections.users.create).toBeUndefined()
    })
  })

  describe('db is Drizzle instance', () => {
    it('db is defined', () => {
      const config = defineConfig({
        database: testAdapter,
        collections: [testCollections.users]
      })

      expect(config.db).toBeDefined()
    })
  })

  describe('empty collections', () => {
    it('works with empty collections array', () => {
      const config = defineConfig({
        database: testAdapter,
        collections: []
      })

      // Type test: collections should be empty object
      expect(Object.keys(config.collections)).toHaveLength(0)
    })
  })

  describe('collection metadata type', () => {
    it('preserves collection slug and name', () => {
      const users = collection({
        slug: 'users',
        name: 'Users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: testAdapter,
        collections: [users]
      })

      expect(config.collections.users.slug).toBe('users')
      expect(config.collections.users.name).toBe('Users')
    })
  })
})
