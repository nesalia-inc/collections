/**
 * Before and After Lifecycle Hooks Example
 *
 * This example demonstrates how to use lifecycle hooks to intercept and modify
 * collection operations. Hooks run within the same transaction as the operation,
 * allowing you to enforce business rules and transform data.
 *
 * Available hooks:
 * - beforeCreate / afterCreate: For create operations
 * - beforeRead / afterRead: For read/find operations
 * - beforeUpdate / afterUpdate: For update operations
 * - beforeDelete / afterDelete: For delete operations
 * - beforeOperation / afterOperation: For all operations (global hooks)
 */

import { collection, field, f } from '@deessejs/collections'
import type {
  CreateHookContext,
  ReadHookContext,
  UpdateHookContext,
  DeleteHookContext,
  BaseHookContext,
  HookHandler,
  InferFieldTypes,
} from '@deessejs/collections'
import { stop, continueWith } from '@deessejs/collections'

// ============================================================================
// 1. Define a Collection with Hooks
// ============================================================================

/**
 * Users collection with lifecycle hooks for:
 * - Generating slugs from names
 * - Hashing passwords before storage
 * - Auditing reads
 * - Validating updates
 * - Soft delete implementation
 */
const users = collection({
  slug: 'users',
  name: 'Users',
  fields: {
    name: field({
      fieldType: f.text({ maxLength: 100 }),
      required: true,
    }),
    email: field({
      fieldType: f.email(),
      required: true,
    }),
    password: field({
      fieldType: f.text({ minLength: 8 }),
      required: true,
    }),
    role: field({
      fieldType: f.select(['admin', 'editor', 'viewer'] as const),
      defaultFactory: () => 'viewer',
    }),
    status: field({
      fieldType: f.select(['active', 'suspended', 'deleted'] as const),
      defaultFactory: () => 'active',
    }),
    lastLoginAt: field({
      fieldType: f.timestamp(),
    }),
  },
  hooks: {
    // ============================================================================
    // Before Create Hook
    // ============================================================================
    /**
     * beforeCreate runs before a record is created.
     * Use it to:
     * - Transform input data
     * - Generate computed fields
     * - Validate data
     * - Stop the operation with an error
     */
    beforeCreate: (async (context) => {
      const data = context.data as Partial<UserFields>

      console.log(`[beforeCreate] Creating user: ${data.email}`)

      // Generate a slug from the name
      if (data.name && !data.email.includes('@')) {
        // This is just illustrative - you'd compute a slug here
        console.log(`[beforeCreate] Generated slug from name: ${data.name.toLowerCase().replace(/\s+/g, '-')}`)
      }

      // Hash the password before storing
      if (data.password) {
        // In real implementation, use bcrypt or similar
        // const hashedPassword = await bcrypt.hash(data.password, 10)
        // data.password = hashedPassword
        console.log(`[beforeCreate] Password would be hashed`)
      }

      // Validate domain restriction (example)
      if (data.email && data.email.endsWith('@blocked-domain.com')) {
        throw new Error('Registration from this domain is not allowed')
      }

      // Return modified context to continue
      return continueWith(context)
    }) as HookHandler<CreateHookContext<'users', Record<string, ReturnType<typeof f.text>>>>,

    // ============================================================================
    // After Create Hook
    // ============================================================================
    /**
     * afterCreate runs after a record is created but within the same transaction.
     * Use it to:
     * - Send welcome emails
     * - Create related records
     * - Log audit trails
     */
    afterCreate: (async (context) => {
      const createdData = context.data as Partial<UserFields>
      console.log(`[afterCreate] User created: ${createdData.email}`)

      // In real implementation:
      // await sendWelcomeEmail(createdData.email)
      // await createUserPreferences(createdData.id)

      return continueWith(context)
    }) as HookHandler<CreateHookContext<'users', Record<string, ReturnType<typeof f.text>>>>,

    // ============================================================================
    // Before Read Hook
    // ============================================================================
    /**
     * beforeRead runs before records are read/found.
     * Use it to:
     * - Add default filters
     * - Check permissions
     * - Modify query parameters
     */
    beforeRead: (async (context) => {
      console.log(`[beforeRead] Query:`, context.query)

      // Example: Add automatic filter to exclude soft-deleted records
      if (!context.query.status) {
        context.query.status = 'active'
      }

      // Example: Check if user has permission to read
      // const hasPermission = await checkReadPermission(context)
      // if (!hasPermission) {
      //   throw new Error('Access denied')
      // }

      return continueWith(context)
    }) as HookHandler<ReadHookContext<'users'>>,

    // ============================================================================
    // After Read Hook
    // ============================================================================
    /**
     * afterRead runs after records are fetched but before they're returned.
     * Use it to:
     * - Sanitize sensitive data
     * - Add computed fields
     * - Audit access
     */
    afterRead: (async (context) => {
      console.log(`[afterRead] Read ${Object.keys(context.query).length} query params`)

      // Example: Remove sensitive fields from results
      // delete context.result.password

      // Example: Audit log
      // await auditLog.recordAccess(context.userId, context.collection, 'read')

      return continueWith(context)
    }) as HookHandler<ReadHookContext<'users'>>,

    // ============================================================================
    // Before Update Hook
    // ============================================================================
    /**
     * beforeUpdate runs before records are updated.
     * Use it to:
     * - Validate update data
     * - Check permissions
     * - Prevent certain changes
     */
    beforeUpdate: (async (context) => {
      const data = context.data as Partial<UserFields>
      const previousData = context.previousData

      console.log(`[beforeUpdate] Updating user: ${previousData.email}`)
      console.log(`[beforeUpdate] Changes:`, Object.keys(data))

      // Example: Prevent role downgrade for admin users
      if (
        previousData.role === 'admin' &&
        data.role === 'viewer'
      ) {
        throw new Error('Cannot downgrade admin users to viewer role')
      }

      // Example: Validate status transitions
      const validTransitions: Record<string, string[]> = {
        active: ['suspended'],
        suspended: ['active', 'deleted'],
        deleted: [],
      }

      const currentStatus = previousData.status ?? 'active'
      const newStatus = data.status

      if (
        newStatus &&
        newStatus !== currentStatus &&
        !validTransitions[currentStatus]?.includes(newStatus)
      ) {
        throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`)
      }

      // Example: Hash password if changed
      if (data.password && data.password !== previousData.password) {
        console.log(`[beforeUpdate] Password changed, would hash`)
      }

      return continueWith(context)
    }) as HookHandler<UpdateHookContext<'users', Record<string, ReturnPoint<typeof f.text>>>>,

    // ============================================================================
    // After Update Hook
    // ============================================================================
    /**
     * afterUpdate runs after records are updated.
     * Use it to:
     * - Invalidate caches
     * - Send notifications
     * - Trigger side effects
     */
    afterUpdate: (async (context) => {
      const data = context.data as Partial<UserFields>
      console.log(`[afterUpdate] User updated:`, Object.keys(data))

      // Example: Send email notification for status changes
      // if (data.status && data.status !== context.previousData.status) {
      //   await sendStatusChangeNotification(context.previousData.email, data.status)
      // }

      return continueWith(context)
    }) as HookHandler<UpdateHookContext<'users', Record<string, ReturnPoint<typeof f.text>>>>,

    // ============================================================================
    // Before Delete Hook
    // ============================================================================
    /**
     * beforeDelete runs before records are deleted.
     * Use it to:
     * - Implement soft delete
     * - Check dependencies
     * - Prevent deletion
     */
    beforeDelete: (async (context) => {
      const previousData = context.previousData

      console.log(`[beforeDelete] Deleting user: ${previousData.email}`)

      // Example: Check for related records
      // const hasOrders = await checkUserOrders(previousData.id)
      // if (hasOrders) {
      //   throw new Error('Cannot delete user with existing orders')
      // }

      // Example: Soft delete instead of hard delete
      // context.operation = 'update'
      // context.data.status = 'deleted'
      // return stop() // Stop the delete, let the update handle it

      return continueWith(context)
    }) as HookHandler<DeleteHookContext<'users', Record<string, ReturnPoint<typeof f.text>>>>,

    // ============================================================================
    // After Delete Hook
    // ============================================================================
    /**
     * afterDelete runs after records are deleted.
     * Use it to:
     * - Clean up related data
     * - Log deletion
     * - Send confirmation
     */
    afterDelete: (async (context) => {
      console.log(`[afterDelete] User deleted`)

      // Example: Clean up related records
      // await deleteUserSessions(previousData.id)
      // await deleteUserTokens(previousData.id)

      return continueWith(context)
    }) as HookHandler<DeleteHookContext<'users', Record<string, ReturnPoint<typeof f.text>>>>,
  },
})

// ============================================================================
// 2. Hook Context Types
// ============================================================================

/**
 * Type definitions for hook contexts
 */

/**
 * CreateHookContext - Available in beforeCreate and afterCreate
 * - operation: 'create'
 * - data: The data being created (mutable in beforeCreate)
 * - collection: The collection slug
 */
type UserFields = InferFieldTypes<typeof users.fields>

/**
 * ReadHookContext - Available in beforeRead and afterRead
 * - operation: 'read'
 * - query: The query parameters (mutable in beforeRead)
 * - collection: The collection slug
 */

/**
 * UpdateHookContext - Available in beforeUpdate and afterUpdate
 * - operation: 'update'
 * - data: The update data (mutable in beforeUpdate)
 * - where: The where clause
 * - previousData: The current record data before update
 * - collection: The collection slug
 */

/**
 * DeleteHookContext - Available in beforeDelete and afterDelete
 * - operation: 'delete'
 * - where: The where clause
 * - previousData: The current record data before delete
 * - collection: The collection slug
 */

// ============================================================================
// 3. Using stop() and continueWith()
// ============================================================================

/**
 * Hooks can control flow using special return values:
 *
 * - continueWith(context): Continue with the operation (possibly modified context)
 * - stop(): Stop the operation without error (used for soft delete pattern)
 * - throw new Error(): Stop with an error (transaction will be rolled back)
 */

// ============================================================================
// 4. Global Hooks (beforeOperation / afterOperation)
// ============================================================================

/**
 * Global hooks run on every operation type.
 * They receive BaseHookContext which includes the operation type.
 */
collection({
  slug: 'users-with-global-hooks',
  name: 'Users With Global Hooks',
  fields: {
    name: field({ fieldType: f.text() }),
    email: field({ fieldType: f.email() }),
  },
  hooks: {
    /**
     * beforeOperation runs before any operation.
     * Use for cross-cutting concerns like authentication, logging.
     */
    beforeOperation: (async (context) => {
      // context.operation is 'create' | 'read' | 'update' | 'delete'
      console.log(`[beforeOperation] ${context.operation} operation starting`)

      // Example: Check authentication
      // if (!context.userId) {
      //   throw new Error('Authentication required')
      // }

      return continueWith(context)
    }) as HookHandler<BaseHookContext<'users-with-global-hooks'>>,

    /**
     * afterOperation runs after any operation.
     * Use for cross-cutting concerns like audit trails, metrics.
     */
    afterOperation: (async (context) => {
      console.log(`[afterOperation] ${context.operation} operation completed`)
      return continueWith(context)
    }) as HookHandler<BaseHookContext<'users-with-global-hooks'>>,
  },
})

// ============================================================================
// 5. Practical Patterns
// ============================================================================

/**
 * Pattern: Soft Delete
 * Use beforeDelete to convert delete to update
 */
// const softDeleteCollection = collection({
//   slug: 'soft-delete-items',
//   fields: {
//     name: field({ fieldType: f.text() }),
//     deletedAt: field({ fieldType: f.timestamp() }),
//   },
//   hooks: {
//     beforeDelete: (async (context) => {
//       // Convert to update
//       context.data = { deletedAt: new Date() }
//       context.operation = 'update' as any
//       return stop() // Stop the delete, continue with update
//     }),
//   },
// })

/**
 * Pattern: Audit Trail
 * Track all changes to records
 */
// const auditedCollection = collection({
//   slug: 'audited-collection',
//   fields: {
//     name: field({ fieldType: f.text() }),
//   },
//   hooks: {
//     afterCreate: (async (context) => {
//       await auditLog.create({
//         collection: context.collection,
//         operation: 'create',
//         recordId: context.data.id,
//         userId: context.userId,
//       })
//       return continueWith(context)
//     }),
//     afterUpdate: (async (context) => {
//       await auditLog.update({
//         collection: context.collection,
//         operation: 'update',
//         recordId: context.previousData.id,
//         userId: context.userId,
//         changes: context.data,
//       })
//       return continueWith(context)
//     }),
//     afterDelete: (async (context) => {
//       await auditLog.delete({
//         collection: context.collection,
//         operation: 'delete',
//         recordId: context.previousData.id,
//         userId: context.userId,
//       })
//       return continueWith(context)
//     }),
//   },
// })

// ============================================================================
// Type Helper for field types (simplified for documentation)
// ============================================================================

type ReturnPoint<T> = T extends () => infer R ? R : never

// ============================================================================
// Usage Summary
// ============================================================================

/**
 * Hook Execution Order:
 * 1. beforeOperation (global)
 * 2. Operation-specific before hook (e.g., beforeCreate)
 * 3. Database operation (create/read/update/delete)
 * 4. Operation-specific after hook (e.g., afterCreate)
 * 5. afterOperation (global)
 *
 * Important Notes:
 * - All hooks run within the same transaction
 * - Return stop() to halt without error (soft delete pattern)
 * - Throw errors to rollback the transaction
 * - Hooks are defined at collection creation time
 */
