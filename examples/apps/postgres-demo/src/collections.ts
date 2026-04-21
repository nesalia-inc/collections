import { collection, field, f } from '@deessejs/collections'
import type { InferFieldTypes } from '@deessejs/collections'

/**
 * Users collection - A simple user profile with name and email
 *
 * Demonstrates:
 * - f.text() for string fields
 * - f.email() for email validation
 * - f.uuid() for unique identifiers
 * - Optional fields with default values
 */
export const users = collection({
  slug: 'users',
  name: 'Users',
  admin: {
    description: 'User profiles with contact information',
    icon: 'users',
  },
  fields: {
    name: field({
      fieldType: f.text({ minLength: 1, maxLength: 100 }),
      required: true,
    }),
    email: field({
      fieldType: f.email(),
      required: true,
    }),
    bio: field({
      fieldType: f.text({ maxLength: 500 }),
    }),
    active: field({
      fieldType: f.boolean(),
      defaultValue: true,
    }),
  },
  hooks: {
    beforeCreate: async (ctx) => {
      console.log(`[Hook] beforeCreate: Creating user "${ctx.data.name}"`)
      return ctx
    },
    afterCreate: async (ctx) => {
      console.log(`[Hook] afterCreate: Created user with id ${ctx.result.id}`)
      return ctx
    },
  },
})

/**
 * Posts collection - A simple blog post with title and content
 *
 * Demonstrates:
 * - f.text() for title and content
 * - f.number() for numeric fields
 * - Relations to users collection
 */
export const posts = collection({
  slug: 'posts',
  name: 'Posts',
  admin: {
    description: 'Blog posts with titles and content',
    icon: 'article',
  },
  fields: {
    title: field({
      fieldType: f.text({ minLength: 1, maxLength: 200 }),
      required: true,
    }),
    content: field({
      fieldType: f.text(),
    }),
    published: field({
      fieldType: f.boolean(),
      defaultValue: false,
    }),
    viewCount: field({
      fieldType: f.number(),
      defaultValue: 0,
    }),
  },
  hooks: {
    beforeCreate: async (ctx) => {
      console.log(`[Hook] beforeCreate: Creating post "${ctx.data.title}"`)
      return ctx
    },
    afterCreate: async (ctx) => {
      console.log(`[Hook] afterCreate: Created post with id ${ctx.result.id}`)
      return ctx
    },
  },
})

/**
 * Type representing a user record
 */
export type UserRecord = InferFieldTypes<typeof users.fields>

/**
 * Type representing a post record
 */
export type PostRecord = InferFieldTypes<typeof posts.fields>
