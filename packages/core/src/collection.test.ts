import { describe, it, expect } from 'vitest'
import { collection } from './collection'
import { field } from './field'
import { text, number, boolean, date, timestamp, enumField, json, array, relation } from './fields'

describe('collection', () => {
  it('creates a basic collection', () => {
    const users = collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: text }),
        email: field({ fieldType: text })
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
        name: field({ fieldType: text })
      }
    })

    expect(users.slug).toBe('users')
    expect(users.name).toBe('Users')
  })

  it('creates a collection with various field types', () => {
    const posts = collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: text }),
        views: field({ fieldType: number }),
        published: field({ fieldType: boolean }),
        createdAt: field({ fieldType: date }),
        updatedAt: field({ fieldType: timestamp }),
        metadata: field({ fieldType: json() }),
        tags: field({ fieldType: array(text) }),
        author: field({ fieldType: relation({ collection: 'users' }) })
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
        name: field({ fieldType: text })
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
        name: field({ fieldType: text, required: true, label: 'Name' }),
        email: field({ fieldType: text, unique: true, indexed: true }),
        age: field({ fieldType: number, default: 18 }),
        bio: field({ fieldType: text, description: 'User biography' })
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
        status: field({ fieldType: enumField(['draft', 'published', 'archived']) })
      }
    })

    expect(posts.fields.status).toBeDefined()
  })

  it('creates a collection with relations', () => {
    const posts = collection({
      slug: 'posts',
      fields: {
        author: field({ fieldType: relation({ collection: 'users' }) }),
        category: field({ fieldType: relation({ collection: 'categories', singular: true }) }),
        tags: field({ fieldType: relation({ collection: 'tags', many: true }) })
      }
    })

    expect(posts.fields.author).toBeDefined()
    expect(posts.fields.category).toBeDefined()
    expect(posts.fields.tags).toBeDefined()
  })
})
