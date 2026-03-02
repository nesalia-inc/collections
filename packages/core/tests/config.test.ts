import { describe, it, expect } from 'vitest'
import { defineConfig, pgAdapter } from '../src'
import { collection } from '../src/collection'
import { field } from '../src/field'
import { f } from '../src'

describe('defineConfig', () => {
  it('creates a config with a single collection', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })

    const users = collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: f.text() })
      }
    })

    const config = defineConfig({
      database: adapter,
      collections: [users]
    })

    expect(config.collections.users).toBeDefined()
  })

  it('creates a config with multiple collections', () => {
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

    expect(config.collections.users).toBeDefined()
    expect(config.collections.posts).toBeDefined()
  })

  it('creates a config with plugins', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })

    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: f.text() }) }
    })

    const mockPlugin = {
      name: 'test-plugin',
      collections: {
        settings: collection({
          slug: 'settings',
          fields: { key: field({ fieldType: f.text() }) }
        })
      }
    }

    const config = defineConfig({
      database: adapter,
      collections: [users],
      plugins: [mockPlugin]
    })

    expect(config.collections.users).toBeDefined()
    expect(config.collections.settings).toBeDefined()
  })

  it('returns drizzle instance for db', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })

    const users = collection({
      slug: 'users',
      fields: { name: field({ fieldType: f.text() }) }
    })

    const config = defineConfig({
      database: adapter,
      collections: [users]
    })

    expect(config.db).not.toBeNull()
    expect(config.db).toBeDefined()
  })
})
