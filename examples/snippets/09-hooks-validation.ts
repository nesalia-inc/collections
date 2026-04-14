/**
 * @deessejs/collections Snippet 09: Validation in Hooks
 *
 * This example demonstrates advanced validation patterns
 * using @deessejs/collections hooks.
 *
 * Hooks provide a powerful way to implement:
 * - Field validation beyond Zod schemas
 * - Business rule validation
 * - Cross-field validation
 * - Conditional validation
 * - Async validation (database checks, API calls)
 *
 * Run with: npx tsx examples/snippets/09-hooks-validation.ts
 */

import { collection, field, f } from '@deessejs/collections'
import type { CreateHookContext, UpdateHookContext } from '@deessejs/collections'
import { continueWith, stop, error } from '@deessejs/collections'

// =============================================================================
// Simple Validation Hooks
// =============================================================================

/**
 * Basic field validation using beforeCreate/beforeUpdate hooks
 */
const users = collection({
  slug: 'users',
  fields: {
    username: field({ fieldType: f.text(), required: true }),
    email: field({ fieldType: f.email(), required: true }),
    age: field({ fieldType: f.number() }),
    role: field({
      fieldType: f.select(['admin', 'editor', 'viewer']),
      required: true,
      defaultValue: 'viewer' as const,
    }),
    status: field({
      fieldType: f.select(['active', 'suspended', 'pending']),
      required: true,
      defaultValue: 'pending' as const,
    }),
  },
  hooks: {
    beforeCreate: async (context) => {
      const errors: string[] = []

      // Validate username length
      if (context.data.username && context.data.username.length < 3) {
        errors.push('Username must be at least 3 characters long')
      }

      // Validate username characters
      if (context.data.username && !/^[a-zA-Z0-9_]+$/.test(context.data.username)) {
        errors.push('Username can only contain letters, numbers, and underscores')
      }

      // Validate age if provided
      if (context.data.age !== undefined) {
        if (context.data.age < 13) {
          errors.push('Users must be at least 13 years old')
        }
        if (context.data.age > 150) {
          errors.push('Please provide a valid age')
        }
      }

      // Admin users must have active status
      if (context.data.role === 'admin' && context.data.status !== 'active') {
        errors.push('Admin users must have active status')
      }

      // If validation errors, throw to abort creation
      if (errors.length > 0) {
        throw new Error(`Validation failed: ${errors.join('; ')}`)
      }

      return continueWith(context)
    },

    beforeUpdate: async (context) => {
      // Similar validation for updates
      // Can add restrictions on what fields can be changed

      // Example: Prevent role downgrade for specific users
      if (context.data.role && context.previousData?.role === 'admin') {
        // Could add logic to prevent demotion
        console.log('Admin role modification detected')
      }

      return continueWith(context)
    },
  },
})

// =============================================================================
// Cross-Field Validation
// =============================================================================

/**
 * Validation that depends on multiple fields
 */
const orders = collection({
  slug: 'orders',
  fields: {
    customerId: field({ fieldType: f.uuid(), required: true }),
    status: field({
      fieldType: f.select(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
      required: true,
      defaultValue: 'pending' as const,
    }),
    totalAmount: field({ fieldType: f.decimal(10, 2) }),
    items: field({ fieldType: f.number() }),
    shippingAddress: field({ fieldType: f.text() }),
    billingAddress: field({ fieldType: f.text() }),
    paidAt: field({ fieldType: f.timestamp() }),
  },
  hooks: {
    beforeCreate: async (context) => {
      // Validate order has items
      if (!context.data.items || context.data.items < 1) {
        throw new Error('Order must have at least one item')
      }

      // Validate total amount for non-zero orders
      if (context.data.items > 0 && (!context.data.totalAmount || context.data.totalAmount <= 0)) {
        throw new Error('Order with items must have a positive total amount')
      }

      return continueWith(context)
    },

    beforeUpdate: async (context) => {
      // Business rule: Cannot cancel shipped orders
      if (context.data.status === 'cancelled' && context.previousData?.status === 'shipped') {
        throw new Error('Cannot cancel an order that has already been shipped')
      }

      // Business rule: Cannot change amount after payment
      if (context.previousData?.paidAt && context.data.totalAmount !== undefined) {
        if (context.data.totalAmount !== context.previousData.totalAmount) {
          throw new Error('Cannot modify order total after payment')
        }
      }

      // Business rule: Shipping address required for non-pending orders
      if (context.data.status && context.data.status !== 'pending') {
        if (!context.data.shippingAddress) {
          throw new Error('Shipping address is required for this operation')
        }
      }

      return continueWith(context)
    },
  },
})

// =============================================================================
// Conditional Validation
// =============================================================================

/**
 * Validation rules that apply only under certain conditions
 */
const articles = collection({
  slug: 'articles',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.text() }),
    status: field({
      fieldType: f.select(['draft', 'review', 'published', 'archived']),
      required: true,
      defaultValue: 'draft' as const,
    }),
    authorId: field({ fieldType: f.uuid(), required: true }),
    publishedAt: field({ fieldType: f.timestamp() }),
    category: field({ fieldType: f.text() }),
    featuredImage: field({ fieldType: f.url() }),
    isFeatured: field({ fieldType: f.boolean(), defaultValue: false }),
  },
  hooks: {
    beforeCreate: async (context) => {
      // Only validate for published articles
      if (context.data.status === 'published') {
        if (!context.data.content || context.data.content.length < 100) {
          throw new Error('Published articles must have at least 100 characters of content')
        }
      }

      return continueWith(context)
    },

    beforeUpdate: async (context) => {
      // When publishing, set publishedAt and validate
      if (context.data.status === 'published' && context.previousData?.status !== 'published') {
        // Set publishedAt timestamp
        // context.data.publishedAt = new Date() // In real integration

        // Validate required fields for publishing
        if (!context.data.content || context.data.content.length < 100) {
          throw new Error('Cannot publish: content is too short')
        }
      }

      // Featured articles must have a featured image
      if (context.data.isFeatured === true && !context.data.featuredImage) {
        throw new Error('Featured articles must have a featured image')
      }

      // Featured articles must be published
      if (context.data.isFeatured === true && context.data.status !== 'published') {
        throw new Error('Only published articles can be featured')
      }

      return continueWith(context)
    },
  },
})

// =============================================================================
// Async Validation
// =============================================================================

/**
 * Validation that requires async operations like database queries
 *
 * Note: In a real application, you'd use your database driver here.
 * This example shows the pattern for async validation.
 */
const teamMembers = collection({
  slug: 'team-members',
  fields: {
    userId: field({ fieldType: f.uuid(), required: true }),
    teamId: field({ fieldType: f.uuid(), required: true }),
    role: field({
      fieldType: f.select(['owner', 'admin', 'member']),
      required: true,
      defaultValue: 'member' as const,
    }),
    joinedAt: field({ fieldType: f.timestamp() }),
  },
  hooks: {
    beforeCreate: async (context) => {
      // Async validation example (pseudo-code):
      //
      // // Check if user exists
      // const user = await db.findUnique('users', { id: context.data.userId })
      // if (!user) {
      //   throw new Error('User does not exist')
      // }
      //
      // // Check if user is already a member of this team
      // const existing = await db.findFirst('team-members', {
      //   where: { userId: context.data.userId, teamId: context.data.teamId }
      // })
      // if (existing) {
      //   throw new Error('User is already a member of this team')
      // }
      //
      // // Check team member limit
      // const memberCount = await db.count('team-members', {
      //   where: { teamId: context.data.teamId }
      // })
      // const MAX_MEMBERS = 10
      // if (memberCount >= MAX_MEMBERS) {
      //   throw new Error(`Team cannot have more than ${MAX_MEMBERS} members`)
      // }
      //
      // // Can only have one owner
      // if (context.data.role === 'owner') {
      //   const existingOwner = await db.findFirst('team-members', {
      //     where: { teamId: context.data.teamId, role: 'owner' }
      //   })
      //   if (existingOwner) {
      //     throw new Error('Team already has an owner')
      //   }
      // }

      console.log('[Async Validation] Would validate user and team membership')
      console.log('[Async Validation] User ID:', context.data.userId)
      console.log('[Async Validation] Team ID:', context.data.teamId)

      return continueWith(context)
    },
  },
})

// =============================================================================
// Validation with Error Accumulation
// =============================================================================

/**
 * Collect multiple validation errors before reporting
 * Useful for showing all errors at once rather than one at a time
 */
interface ValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Helper function to accumulate validation errors
 */
function validateField(
  errors: string[],
  condition: boolean,
  message: string
): void {
  if (!condition) {
    errors.push(message)
  }
}

const registrations = collection({
  slug: 'registrations',
  fields: {
    email: field({ fieldType: f.email(), required: true }),
    password: field({ fieldType: f.text(), required: true }),
    confirmPassword: field({ fieldType: f.text() }),
    firstName: field({ fieldType: f.text(), required: true }),
    lastName: field({ fieldType: f.text(), required: true }),
    dateOfBirth: field({ fieldType: f.date() }),
    acceptTerms: field({ fieldType: f.boolean(), required: true }),
  },
  hooks: {
    beforeCreate: async (context) => {
      const errors: string[] = []

      // Password validation
      if (context.data.password) {
        validateField(errors, context.data.password.length >= 8, 'Password must be at least 8 characters')
        validateField(errors, /[A-Z]/.test(context.data.password), 'Password must contain at least one uppercase letter')
        validateField(errors, /[a-z]/.test(context.data.password), 'Password must contain at least one lowercase letter')
        validateField(errors, /[0-9]/.test(context.data.password), 'Password must contain at least one number')

        // Cross-field validation
        if (context.data.confirmPassword !== context.data.password) {
          errors.push('Passwords do not match')
        }
      }

      // Name validation
      if (context.data.firstName) {
        validateField(errors, context.data.firstName.length >= 1, 'First name is required')
        validateField(errors, context.data.firstName.length <= 50, 'First name must be 50 characters or less')
      }

      if (context.data.lastName) {
        validateField(errors, context.data.lastName.length >= 1, 'Last name is required')
        validateField(errors, context.data.lastName.length <= 50, 'Last name must be 50 characters or less')
      }

      // Date of birth validation
      if (context.data.dateOfBirth) {
        const today = new Date()
        const dob = new Date(context.data.dateOfBirth)
        const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

        validateField(errors, age >= 13, 'Must be at least 13 years old')
        validateField(errors, age <= 120, 'Please enter a valid date of birth')
      }

      // Terms acceptance
      if (!context.data.acceptTerms) {
        errors.push('You must accept the terms and conditions')
      }

      // If any errors, throw all of them
      if (errors.length > 0) {
        throw new Error(`Validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`)
      }

      return continueWith(context)
    },
  },
})

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Validation in Hooks ===')
console.log('')
console.log('Collections with validation:')
console.log('- users:', Object.keys(users.hooks))
console.log('- orders:', Object.keys(orders.hooks))
console.log('- articles:', Object.keys(articles.hooks))
console.log('- registrations:', Object.keys(registrations.hooks))
console.log('')
console.log('Validation patterns demonstrated:')
console.log('- Field validation')
console.log('- Cross-field validation')
console.log('- Conditional validation')
console.log('- Async validation (with database checks)')
console.log('- Error accumulation')
console.log('')
console.log('Validation hooks examples complete!')
