import { collection, field, f } from '@deessejs/collections'
import type { InferFieldTypes } from '@deessejs/collections'

/**
 * TodosStatus enum values
 */
const STATUS_VALUES = ['pending', 'in_progress', 'completed'] as const

/**
 * Todos collection - A simple todo item with title, completed status, and status
 *
 * Demonstrates:
 * - f.text() for string fields
 * - f.boolean() for boolean fields
 * - f.select() for enum-like fields
 * - Default values and required fields
 */
export const todos = collection({
  slug: 'todos',
  name: 'Todos',
  admin: {
    description: 'Simple todo items with status tracking',
    icon: 'checklist',
  },
  fields: {
    title: field({
      fieldType: f.text({ minLength: 1, maxLength: 200 }),
      required: true,
    }),
    completed: field({
      fieldType: f.boolean(),
      defaultValue: false,
    }),
    status: field({
      fieldType: f.select(['pending', 'in_progress', 'completed']),
      defaultValue: 'pending',
    }),
  },
  hooks: {
    beforeCreate: async (ctx) => {
      console.log(`[Hook] beforeCreate: Creating todo "${ctx.data.title}"`)
      // Ensure title is trimmed
      if (typeof ctx.data.title === 'string') {
        ctx.data.title = ctx.data.title.trim()
      }
      return ctx
    },
    afterCreate: async (ctx) => {
      console.log(`[Hook] afterCreate: Created todo with id`)
      return ctx
    },
    beforeUpdate: async (ctx) => {
      console.log(`[Hook] beforeUpdate: Updating todo`)
      return ctx
    },
    afterUpdate: async (ctx) => {
      console.log(`[Hook] afterUpdate: Updated todo`)
      return ctx
    },
    beforeDelete: async (ctx) => {
      console.log(`[Hook] beforeDelete: Deleting todo`)
      return ctx
    },
    afterDelete: async (ctx) => {
      console.log(`[Hook] afterDelete: Deleted todo`)
      return ctx
    },
  },
})

/**
 * Type representing a todo record
 */
export type TodoRecord = InferFieldTypes<typeof todos.fields>

/**
 * Status values for todos
 */
export type TodosStatus = typeof STATUS_VALUES[number]
