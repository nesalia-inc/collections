/**
 * Validation + Hooks Example
 *
 * This example demonstrates the hooks system integrated with collections.
 * Hooks allow you to intercept and transform data during CRUD operations.
 */

import { collection, field, f } from '@deessejs/collections'

// Simulated external functions (not implemented - just conceptual)
const hashPassword = async (password: string): Promise<string> => {
  // In real implementation, this would use bcrypt or similar
  return `hashed_${password}`
}

const sendEmail = async (email: string, _subject: string): Promise<void> => {
  // In real implementation, this would send an actual email
  console.log(`[Email] Would send to: ${email}`)
}

const deleteUserSessions = async (userId: string): Promise<void> => {
  // In real implementation, this would cleanup session data
  console.log(`[Sessions] Would delete sessions for user: ${userId}`)
}

// ============================================
// Collection with Hooks
// ============================================

const users = collection({
  slug: 'users',
  hooks: {
    /**
     * beforeCreate: Transform data before inserting into the database.
     * Use case: Hash passwords, normalize data, add computed fields.
     */
    beforeCreate: async (data) => {
      // Hash password before storing
      return { ...data, passwordHash: await hashPassword(data.password) }
    },

    /**
     * afterCreate: Act on the created record after insertion.
     * Use case: Send notifications, log activity, trigger external systems.
     */
    afterCreate: async (user) => {
      // Send welcome email
      await sendEmail(user.email, 'Welcome!')
    },

    /**
     * beforeUpdate: Transform data before updating a record.
     * Use case: Re-hash passwords if changed, track modifications, validate transitions.
     */
    beforeUpdate: async (data) => {
      // If password is being updated, re-hash it
      if (data.password) {
        return { ...data, passwordHash: await hashPassword(data.password) }
      }
      return data
    },

    /**
     * afterDelete: Cleanup after a record is deleted.
     * Use case: Remove related data, revoke tokens, log deletion.
     */
    afterDelete: async (user) => {
      // Cleanup related data
      await deleteUserSessions(user.id)
    },
  },
  fields: {
    email: field({ fieldType: f.email(), required: true, unique: true }),
    password: field({ fieldType: f.text(), required: true }), // Will be hashed by beforeCreate
    name: field({ fieldType: f.text(), required: true }),
    age: field({ fieldType: f.number(), required: false }),
    status: field({
      fieldType: f.select(['active', 'suspended', 'banned'] as const),
      defaultValue: 'active'
    }),
  },
})

// ============================================
// Build Schema
// ============================================

import { createPostgresSchema } from '@deessejs/collections/adapter/postgresql'

const pgSchema = createPostgresSchema([users])

// ============================================
// Hook Execution Flow
// ============================================

/**
 * When calling create():
 *
 * await create(db, pgSchema.users, {
 *   email: 'test@example.com',
 *   password: 'secret123',
 *   name: 'Test User',
 *   age: 25
 * })
 *
 * Flow:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 1. beforeCreate(data)                                      │
 * │    Input:  { email, password, name, age }                  │
 * │    Output: { email, passwordHash: 'hashed_secret123',      │
 * │             name, age }                                     │
 * └─────────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 2. db.insert(users).values({...})                           │
 * │    Executes the actual database insert with hashed password │
 * └─────────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 3. afterCreate(createdUser)                                │
 * │    Input: Full created user record including id, timestamps │
 * │    Side effect: Sends welcome email to user.email           │
 * └─────────────────────────────────────────────────────────────┘
 */

/**
 * When calling update():
 *
 * await update(db, pgSchema.users, userId, { password: 'newpassword' })
 *
 * Flow:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 1. beforeUpdate({ password: 'newpassword' })                │
 * │    Input:  { password: 'newpassword' }                      │
 * │    Output: { passwordHash: 'hashed_newpassword' }           │
 * │    Note: Original password field is removed, only hash kept │
 * └─────────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 2. db.update(users).set({...}).where(id)                    │
 * │    Executes the update with the hashed password             │
 * └─────────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 3. afterUpdate(updatedUser)                                │
 * │    Input: Full updated user record                          │
 * └─────────────────────────────────────────────────────────────┘
 */

/**
 * When calling delete():
 *
 * await delete(db, pgSchema.users, userId)
 *
 * Flow:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 1. beforeDelete(user)                                      │
 * │    Input: The user record being deleted                     │
 * │    Can abort deletion by throwing                          │
 * └─────────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 2. db.delete(users).where(id)                              │
 * │    Executes the actual deletion                             │
 * └─────────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────────┐
 * │ 3. afterDelete(user)                                       │
 * │    Input: The now-deleted user record                       │
 * │    Side effect: Cleans up user sessions                     │
 * └─────────────────────────────────────────────────────────────┘
 */

// ============================================
// Validation Notes
// ============================================

/**
 * NOTE: The current CRUD implementation supports hooks,
 * but Zod validation from field schemas is NOT yet integrated
 * into the create/update operations.
 *
 * This example demonstrates WHERE validation hooks would fit:
 *
 * beforeCreate: Validate input data before processing
 * beforeUpdate: Validate partial data before merging with existing
 *
 * Future integration:
 *
 * beforeCreate: async (data) => {
 *   const result = userSchema.safeParse(data)
 *   if (!result.success) {
 *     throw new ValidationError(result.error)
 *   }
 *   return result.data
 * }
 *
 * The field definitions (email, required, unique, etc.) provide
 * the schema information that would drive this validation.
 */

// ============================================
// Console Output
// ============================================

console.log('User schema created with hooks')
console.log('Hooks: beforeCreate, afterCreate, beforeUpdate, afterDelete')
console.log('')
console.log('Hook flow for create operation:')
console.log('  beforeCreate -> db.insert -> afterCreate')
console.log('')
console.log('Hook flow for update operation:')
console.log('  beforeUpdate -> db.update -> afterUpdate')
console.log('')
console.log('Hook flow for delete operation:')
console.log('  beforeDelete -> db.delete -> afterDelete')