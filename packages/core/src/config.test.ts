import { describe, it, expect } from 'vitest'
import { defineConfig } from './config'
import { collection } from './collection'
import { field } from './field'
import { text } from './fields'

describe('defineConfig', () => {
  it('creates a config with a single collection', () => {
    const users = collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: text })
      }
    })

    const config = defineConfig({
      database: { url: 'postgres://localhost:5432/db' },
      collections: [users]
    })

    expect(config.collections.users).toBeDefined()
    expect(config.$meta.collections).toContain('users')
    expect(config.$meta.collections).toHaveLength(1)
  })

  it('creates a config with multiple collections', () => {
    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: text }) }
    })

    const posts = collection({
      slug: 'posts',
      fields: { title: field({ fieldType: text }) }
    })

    const config = defineConfig({
      database: { url: 'postgres://localhost:5432/db' },
      collections: [users, posts]
    })

    expect(config.collections.users).toBeDefined()
    expect(config.collections.posts).toBeDefined()
    expect(config.$meta.collections).toHaveLength(2)
    expect(config.$meta.collections).toContain('users')
    expect(config.$meta.collections).toContain('posts')
  })

  it('creates a config with plugins', () => {
    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: text }) }
    })

    const mockPlugin = {
      name: 'test-plugin',
      collections: {
        settings: collection({
          slug: 'settings',
          fields: { key: field({ fieldType: text }) }
        })
      }
    }

    const config = defineConfig({
      database: { url: 'postgres://localhost:5432/db' },
      collections: [users],
      plugins: [mockPlugin]
    })

    expect(config.collections.users).toBeDefined()
    expect(config.collections.settings).toBeDefined()
    expect(config.$meta.collections).toContain('users')
    expect(config.$meta.collections).toContain('settings')
    expect(config.$meta.plugins).toContain('test-plugin')
  })

  it('tracks plugin collections correctly', () => {
    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: text }) }
    })

    const mockPlugin1 = {
      name: 'plugin-1',
      collections: {
        plugin1Table: collection({
          slug: 'plugin1Table',
          fields: { data: field({ fieldType: text }) }
        })
      }
    }

    const mockPlugin2 = {
      name: 'plugin-2',
      collections: {
        plugin2Table: collection({
          slug: 'plugin2Table',
          fields: { value: field({ fieldType: text }) }
        })
      }
    }

    const config = defineConfig({
      database: { url: 'postgres://localhost:5432/db' },
      collections: [users],
      plugins: [mockPlugin1, mockPlugin2]
    })

    expect(config.$meta.collections).toHaveLength(3)
    expect(config.$meta.plugins).toHaveLength(2)
    expect(config.$meta.plugins).toContain('plugin-1')
    expect(config.$meta.plugins).toContain('plugin-2')
  })

  it('returns null for db (placeholder)', () => {
    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: text }) }
    })

    const config = defineConfig({
      database: { url: 'postgres://localhost:5432/db' },
      collections: [users]
    })

    expect(config.db).toBeNull()
  })
})
