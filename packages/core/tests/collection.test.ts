import { describe, it, expect } from 'vitest'
import { collection } from '../src/collection'
import { field } from '../src/field'
import * as f from '../src/fields'
import { required, unique, indexed, defaultValue, label, description } from '../src/field-utils'

describe('collection', () => {
  it('creates a basic collection', () => {
    const users = collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: f.text() }),
        email: field({ fieldType: f.text() })
      }
    })

    expect(users.slug).toBe('users')
    expect(users.name).toBeUndefined()
    expect(Object.keys(users.fields)).toContain('name')
    expect(Object.keys(users.fields)).toContain('email')
  })

  it('creates a collection with name', () => {
    const users = collection({
      slug: 'users',
      name: 'Users',
      fields: {
        name: field({ fieldType: f.text() })
      }
    })

    expect(users.slug).toBe('users')
    expect(users.name).toBe('Users')
  })

  it('creates a collection with various field types', () => {
    const posts = collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text() }),
        views: field({ fieldType: f.number() }),
        published: field({ fieldType: f.boolean() }),
        createdAt: field({ fieldType: f.date() }),
        updatedAt: field({ fieldType: f.timestamp() }),
        metadata: field({ fieldType: f.json() }),
        tags: field({ fieldType: f.array(f.text()) }),
        author: field({ fieldType: f.relation({ collection: 'users' }) })
      }
    })

    expect(posts.slug).toBe('posts')
    expect(Object.keys(posts.fields)).toHaveLength(8)
  })

  it('creates a collection with hooks', () => {
    const mockHook = async () => {}

    const users = collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: f.text() })
      },
      hooks: {
        beforeCreate: [mockHook],
        afterCreate: [mockHook],
        beforeUpdate: [mockHook],
        afterUpdate: [mockHook],
        beforeDelete: [mockHook],
        afterDelete: [mockHook]
      }
    })

    expect(users.hooks?.beforeCreate).toHaveLength(1)
    expect(users.hooks?.afterCreate).toHaveLength(1)
    expect(users.hooks?.beforeUpdate).toHaveLength(1)
    expect(users.hooks?.afterUpdate).toHaveLength(1)
    expect(users.hooks?.beforeDelete).toHaveLength(1)
    expect(users.hooks?.afterDelete).toHaveLength(1)
  })

  it('creates a collection with field options', () => {
    const users = collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: f.text(), required: true, label: 'Name' }),
        email: field({ fieldType: f.text(), unique: true, indexed: true }),
        age: field({ fieldType: f.number(), default: 18 }),
        bio: field({ fieldType: f.text(), description: 'User biography' })
      }
    })

    expect(users.fields.name.required).toBe(true)
    expect(users.fields.name.label).toBe('Name')
    expect(users.fields.email.unique).toBe(true)
    expect(users.fields.email.indexed).toBe(true)
    expect(users.fields.age.default).toBe(18)
    expect(users.fields.bio.description).toBe('User biography')
  })

  it('creates a collection with enum field', () => {
    const posts = collection({
      slug: 'posts',
      fields: {
        status: field({ fieldType: f.select(['draft', 'published', 'archived']) })
      }
    })

    expect(posts.fields.status).toBeDefined()
  })

  it('creates a collection with relations', () => {
    const posts = collection({
      slug: 'posts',
      fields: {
        author: field({ fieldType: f.relation({ collection: 'users' }) }),
        category: field({ fieldType: f.relation({ collection: 'categories', singular: true }) }),
        tags: field({ fieldType: f.relation({ collection: 'tags', many: true }) })
      }
    })

    expect(posts.fields.author).toBeDefined()
    expect(posts.fields.category).toBeDefined()
    expect(posts.fields.tags).toBeDefined()
  })
})
