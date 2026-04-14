/**
 * @deessejs/collections Snippet 08: Basic Hooks
 *
 * This example demonstrates how to use lifecycle hooks
 * in @deessejs/collections collections.
 *
 * Hooks allow you to run custom logic before or after
 * CRUD operations. They run within the same transaction
 * as the operation itself.
 *
 * Run with: npx tsx examples/snippets/08-hooks-basic.ts
 */

import { collection, field, f } from '@deessejs/collections'

// =============================================================================
// Collection Setup
// =============================================================================

/**
 * Define fields separately to avoid circular type reference
 */
const postFields = {
  title: field({ fieldType: f.text(), required: true }),
  content: field({ fieldType: f.text() }),
  status: field({
    fieldType: f.select(['draft', 'published', 'archived']),
    required: true,
    defaultValue: 'draft' as const,
  }),
  slug: field({ fieldType: f.text() }),
  authorId: field({ fieldType: f.uuid() }),
  viewCount: field({ fieldType: f.number() }),
}

/**
 * Define a collection with hooks
 */
const posts = collection({
  slug: 'posts',
  fields: postFields,
  hooks: {
    /**
     * beforeCreate - Called before a new record is created
     *
     * @param context - Contains the data being created
     * @returns Modified context (can mutate data) or stop(context) to abort
     */
    beforeCreate: (async (context) => {
      console.log(`[beforeCreate] Creating post with title: "${context.data.title}"`)

      // Generate slug from title if not provided
      if (!context.data.slug && context.data.title) {
        context.data.slug = context.data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      }

      // You can modify the data before it's saved
      if (context.data.status === 'published' && !context.data.viewCount) {
        context.data.viewCount = 0
      }

      // Return context to continue, or stop(context) to abort
      return context
    }),

    /**
     * afterCreate - Called after a record is created
     *
     * @param context - Contains the created data
     * @returns Can return stop(context) to prevent further processing (rarely used)
     */
    afterCreate: (async (context) => {
      console.log(`[afterCreate] Post created successfully!`)
      console.log(`[afterCreate] Generated ID: ${(context.data as any).id}`)

      // Common use cases:
      // - Send welcome email
      // - Initialize related records
      // - Log analytics event

      return context
    }),

    /**
     * beforeUpdate - Called before records are updated
     *
     * @param context - Contains update data, where clause, and previous data
     */
    beforeUpdate: (async (context) => {
      console.log(`[beforeUpdate] Updating posts matching:`, context.where)

      // Add timestamp for updates
      if (context.data) {
        // context.data contains the partial update
        console.log(`[beforeUpdate] Update payload:`, context.data)
      }

      // Can access previous data before update
      if (context.previousData) {
        console.log(`[beforeUpdate] Previous status: ${(context.previousData as any).status}`)
      }

      return context
    }),

    /**
     * afterUpdate - Called after records are updated
     */
    afterUpdate: (async (context) => {
      console.log(`[afterUpdate] Post(s) updated successfully!`)

      return context
    }),

    /**
     * beforeDelete - Called before records are deleted
     *
     * @param context - Contains where clause and previous data
     */
    beforeDelete: (async (context) => {
      console.log(`[beforeDelete] Deleting posts matching:`, context.where)

      // Can abort deletion based on conditions
      // Example: Prevent deletion of published posts
      // if ((context.previousData as any)?.status === 'published') {
      //   console.log('Cannot delete published posts')
      //   return stop(context) // This will abort the delete
      // }

      return context
    }),

    /**
     * afterDelete - Called after records are deleted
     */
    afterDelete: (async (context) => {
      console.log(`[afterDelete] Post(s) deleted successfully`)

      return context
    }),
  },
})

// =============================================================================
// Hook Handler Types
// =============================================================================

/**
 * Hook handlers have this signature:
 *
 * async function handler(context: HookContext): Promise<HookContext>
 *
 * Return values:
 * - Return context - Continue to next hook or operation
 * - Return stop(context) - Stop execution, skip the operation
 * - Throw error - Will abort the operation with an error
 */

// =============================================================================
// Hooks with Early Exit (stop)
// =============================================================================

/**
 * Example: Collection with hook that can prevent actions
 */
const protectedContentFields = {
  title: field({ fieldType: f.text(), required: true }),
  content: field({ fieldType: f.text() }),
  isLocked: field({ fieldType: f.boolean(), defaultValue: false }),
}

const protectedContent = collection({
  slug: 'protected-content',
  fields: protectedContentFields,
  hooks: {
    beforeDelete: (async (context) => {
      // Check if content is locked
      // In real usage, you'd query the database to get previousData
      // This is a simplified example
      if ((context.previousData as any)?.isLocked === true) {
        console.log('Cannot delete locked content!')
        // Note: Early exit via stop() has type limitations
        // In practice, throw an error to abort the operation
        throw new Error('Cannot delete locked content')
      }
      return context
    }),
  },
})

// =============================================================================
// Global Hooks (beforeOperation / afterOperation)
// =============================================================================

/**
 * beforeOperation - Runs before ANY operation (create, read, update, delete)
 * afterOperation - Runs after ANY operation
 *
 * These are useful for:
 * - Logging all operations
 * - Checking permissions
 * - Audit trails
 */

const auditedCollectionFields = {
  action: field({ fieldType: f.text(), required: true }),
  entityType: field({ fieldType: f.text(), required: true }),
  entityId: field({ fieldType: f.uuid(), required: true }),
  performedBy: field({ fieldType: f.uuid() }),
  timestamp: field({ fieldType: f.timestamp() }),
}

const auditedCollection = collection({
  slug: 'audit-entries',
  fields: auditedCollectionFields,
  hooks: {
    beforeOperation: (async (context) => {
      console.log(`[Audit] Operation: ${context.operation} on ${context.collection}`)
      // Could check permissions here
      // Could log to audit table
      return context
    }),
    afterOperation: (async (context) => {
      console.log(`[Audit] Completed: ${context.operation} on ${context.collection}`)
      return context
    }),
  },
})

// =============================================================================
// Error Handling in Hooks
// =============================================================================

/**
 * If a hook throws an error, the operation is aborted.
 * The error propagates to the caller.
 */

const validatedFields = {
  name: field({ fieldType: f.text(), required: true }),
  email: field({ fieldType: f.email() }),
}

const validatedCollection = collection({
  slug: 'validated-records',
  fields: validatedFields,
  hooks: {
    beforeCreate: (async (context) => {
      // Validate business rules
      if ((context.data as any).email && (context.data as any).email.endsWith('@blocked.com')) {
        throw new Error('Cannot create record with blocked email domain')
      }
      return context
    }),
  },
})

// =============================================================================
// Async Operations in Hooks
// =============================================================================

/**
 * All hooks support async operations.
 * They run within the same transaction as the database operation.
 *
 * Common async use cases:
 * - Send emails
 * - Call external APIs
 * - Query additional data
 */

const notificationFields = {
  recipientId: field({ fieldType: f.uuid(), required: true }),
  type: field({
    fieldType: f.select(['email', 'sms', 'push']),
    required: true,
  }),
  message: field({ fieldType: f.text(), required: true }),
  sent: field({ fieldType: f.boolean(), defaultValue: false }),
}

const notificationCollection = collection({
  slug: 'notifications',
  fields: notificationFields,
  hooks: {
    afterCreate: (async (context) => {
      // In real usage, you'd send the notification asynchronously
      // using a message queue (Redis, SQS, etc.)
      console.log(`[Notification] Would send ${(context.data as any).type} to ${(context.data as any).recipientId}`)
      console.log(`[Notification] Message: ${(context.data as any).message}`)

      // Could update the record to mark as sent
      // await db.update('notifications', { sent: true }, { id: context.data.id })

      return context
    }),
  },
})

// =============================================================================
// Type Safety with Hooks
// =============================================================================

/**
 * Hooks are fully type-safe based on your collection's fields.
 * TypeScript will ensure you access only valid fields.
 */

// The context.data property is typed based on your collection's fields.
// Since TypeScript erases generics at runtime, the actual field values
// are accessible via property access, though the types may show as 'unknown'
// in some contexts due to the generic nature of the hook system.

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Basic Hooks ===')
console.log('')
console.log(`Posts collection hooks:`)
console.log(Object.keys(posts.hooks))
console.log('')
console.log('Hooks examples complete!')
console.log('')
console.log('Note: Hooks require a database driver integration to run.')
console.log('The hooks defined above will execute during CRUD operations.')
