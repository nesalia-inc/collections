import { describe, it, expect } from 'vitest'
import { defineConfig, collection, field, f } from '../src'
import type { Collection } from '../src/collection'
import type { DefineConfigReturn } from '../src/config'
import type { CollectionOperations } from '../src/operations'

describe('Type Inference', () => {
  describe('collection slug inference', () => {
    it('infers users and posts as collection keys', () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() }),
          email: field({ fieldType: f.text() })
        }
      })

      const posts = collection({
        slug: 'posts',
        fields: {
          title: field({ fieldType: f.text() })
        }
      })

      const config = defineConfig({
        database: { url: 'postgres://localhost:5432/db' },
        collections: [users, posts]
      })

      // Type test: config.collections should have users and posts keys
      const _users = config.collections.users
      const _posts = config.collections.posts

      expect(_users).toBeDefined()
      expect(_posts).toBeDefined()
    })

    it('infers single collection slug', () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const config = defineConfig({
        database: { url: 'postgres://localhost:5432/db' },
        collections: [users]
      })

      const _users = config.collections.users
      expect(_users).toBeDefined()
    })

    it('infers $meta.collections as array of slugs', () => {
      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const posts = collection({
        slug: 'posts',
        fields: { title: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: { url: 'postgres://localhost:5432/db' },
        collections: [users, posts]
      })

      // Type test: $meta.collections should be string[]
      const _meta: string[] = config.$meta.collections
      expect(_meta).toContain('users')
      expect(_meta).toContain('posts')
    })
  })

  describe('operations type inference', () => {
    it('collections have all CRUD operations', () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      const config = defineConfig({
        database: { url: 'postgres://localhost:5432/db' },
        collections: [users]
      })

      // Type test: all operations should exist
      expect(config.collections.users.findMany).toBeDefined()
      expect(config.collections.users.findUnique).toBeDefined()
      expect(config.collections.users.findFirst).toBeDefined()
      expect(config.collections.users.create).toBeDefined()
      expect(config.collections.users.createMany).toBeDefined()
      expect(config.collections.users.update).toBeDefined()
      expect(config.collections.users.updateMany).toBeDefined()
      expect(config.collections.users.delete).toBeDefined()
      expect(config.collections.users.deleteMany).toBeDefined()
      expect(config.collections.users.count).toBeDefined()
      expect(config.collections.users.exists).toBeDefined()
    })

    it('operations are functions', () => {
      const users = collection({
        slug: 'users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: { url: 'postgres://localhost:5432/db' },
        collections: [users]
      })

      expect(typeof config.collections.users.findMany).toBe('function')
      expect(typeof config.collections.users.findUnique).toBe('function')
      expect(typeof config.collections.users.create).toBe('function')
      expect(typeof config.collections.users.update).toBe('function')
      expect(typeof config.collections.users.delete).toBe('function')
    })
  })

  describe('collection data type inference', () => {
    it('preserves collection data type when provided', () => {
      interface UserData {
        name: string
        email: string
        age: number
      }

      const users = collection<UserData>({
        slug: 'users',
        dataType: {} as UserData,
        fields: {
          name: field({ fieldType: f.text() }),
          email: field({ fieldType: f.text() }),
          age: field({ fieldType: f.number() })
        }
      })

      const config = defineConfig({
        database: { url: 'postgres://localhost:5432/db' },
        collections: [users]
      })

      // Type test: collection should preserve dataType when provided
      expect(users.dataType).toBeDefined()
    })

    it('collection without dataType has undefined dataType', () => {
      const users = collection({
        slug: 'users',
        fields: {
          name: field({ fieldType: f.text() })
        }
      })

      // dataType is optional, so it can be undefined
      expect(users.dataType).toBeUndefined()
    })
  })

  describe('empty collections', () => {
    it('works with empty collections array', () => {
      const config = defineConfig({
        database: { url: 'postgres://localhost:5432/db' },
        collections: []
      })

      // Type test: collections should be empty object
      expect(Object.keys(config.collections)).toHaveLength(0)
    })
  })

  describe('collection metadata', () => {
    it('preserves collection slug and name', () => {
      const users = collection({
        slug: 'users',
        name: 'Users',
        fields: { name: field({ fieldType: f.text() }) }
      })

      const config = defineConfig({
        database: { url: 'postgres://localhost:5432/db' },
        collections: [users]
      })

      expect(config.collections.users.slug).toBe('users')
      expect(config.collections.users.name).toBe('Users')
    })
  })
})
