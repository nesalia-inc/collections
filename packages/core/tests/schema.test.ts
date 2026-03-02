import { describe, it, expect } from 'vitest'
import { buildSchema, buildTable } from '../src'
import { collection } from '../src/collection'
import { field } from '../src/field'
import { f } from '../src'

describe('buildSchema', () => {
  it('builds a table from a collection', () => {
    const users = collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: f.text() }),
        email: field({ fieldType: f.text() })
      }
    })

    const table = buildTable(users)

    expect(table).toBeDefined()
  })

  it('builds schema from multiple collections', () => {
    const users = collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: f.text() })
      }
    })

    const posts = collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text() })
      }
    })

    const schema = buildSchema([users, posts])

    expect(schema.users).toBeDefined()
    expect(schema.posts).toBeDefined()
  })

  it('handles different field types', () => {
    const items = collection({
      slug: 'items',
      fields: {
        name: field({ fieldType: f.text() }),
        count: field({ fieldType: f.number() }),
        active: field({ fieldType: f.boolean() }),
        createdAt: field({ fieldType: f.timestamp() })
      }
    })

    const schema = buildSchema([items])

    expect(schema.items).toBeDefined()
  })
})
