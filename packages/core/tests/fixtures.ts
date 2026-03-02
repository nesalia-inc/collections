import { beforeEach } from 'vitest'
import { pgAdapter } from '../src'
import { collection } from '../src/collection'
import { field } from '../src/field'
import { f } from '../src'

/**
 * Shared test fixtures to avoid DRY violations
 */

export const testAdapter = pgAdapter({
  url: 'postgres://localhost:5432/db'
})

export const testCollections = {
  users: collection({
    slug: 'users',
    name: 'Users',
    fields: {
      name: field({ fieldType: f.text() }),
      email: field({ fieldType: f.text() })
    }
  }),
  posts: collection({
    slug: 'posts',
    fields: {
      title: field({ fieldType: f.text() }),
      content: field({ fieldType: f.text() })
    }
  }),
  comments: collection({
    slug: 'comments',
    fields: {
      body: field({ fieldType: f.text() })
    }
  })
}

/**
 * Vitest setup - runs before each test file
 */
beforeEach(() => {
  // Reset or cleanup if needed
})
