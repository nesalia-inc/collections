import { describe, it, expect } from 'vitest'
import { defineConfig } from '../src'
import { collection } from '../src/collection'
import { field } from '../src/field'
import { f } from '../src'
import { testAdapter, testCollections } from './fixtures'

describe('defineConfig', () => {
  it('creates a config with a single collection', () => {
    const config = defineConfig({
      database: testAdapter,
      collections: [testCollections.users]
    })

    expect(config.collections.users).toBeDefined()
  })

  it('creates a config with multiple collections', () => {
    const config = defineConfig({
      database: testAdapter,
      collections: [testCollections.users, testCollections.posts]
    })

    expect(config.collections.users).toBeDefined()
    expect(config.collections.posts).toBeDefined()
  })

  it('creates a config with plugins', () => {
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
      database: testAdapter,
      collections: [testCollections.users],
      plugins: [mockPlugin]
    })

    expect(config.collections.users).toBeDefined()
    expect(config.collections.settings).toBeDefined()
  })

  it('returns drizzle instance for db', () => {
    const config = defineConfig({
      database: testAdapter,
      collections: [testCollections.users]
    })

    expect(config.db).not.toBeNull()
    expect(config.db).toBeDefined()
  })
})
