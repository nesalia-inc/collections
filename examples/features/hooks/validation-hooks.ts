/**
 * Validation Hooks Example
 *
 * This example demonstrates how to use hooks for data validation.
 * Hooks provide a powerful way to enforce business rules, validate input,
 * and ensure data integrity at the collection level.
 *
 * Unlike Zod schemas which validate at the field level, hooks allow you to:
 * - Validate relationships between fields
 * - Enforce business rules and invariants
 * - Validate state transitions
 * - Perform async validation (e.g., check uniqueness in DB)
 */

import { collection, field, f } from '@deessejs/collections'
import type {
  CreateHookContext,
  UpdateHookContext,
  HookHandler,
  InferFieldTypes,
} from '@deessejs/collections'
import { continueWith, error } from '@deessejs/collections'

// ============================================================================
// 1. Define a Collection with Validation Hooks
// ============================================================================

/**
 * Orders collection with comprehensive validation
 */
const orders = collection({
  slug: 'orders',
  name: 'Orders',
  fields: {
    customerId: field({
      fieldType: f.uuid(),
      required: true,
    }),
    items: field({
      fieldType: f.json<OrderItem[]>(),
      required: true,
    }),
    subtotal: field({
      fieldType: f.decimal({ precision: 10, scale: 2 }),
      required: true,
    }),
    tax: field({
      fieldType: f.decimal({ precision: 10, scale: 2 }),
      required: true,
    }),
    total: field({
      fieldType: f.decimal({ precision: 10, scale: 2 }),
      required: true,
    }),
    status: field({
      fieldType: f.select([
        'draft',
        'pending',
        'confirmed',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
      ] as const),
      defaultFactory: () => 'draft',
    }),
    shippingAddress: field({
      fieldType: f.json<Address>(),
    }),
    billingAddress: field({
      fieldType: f.json<Address>(),
    }),
    notes: field({
      fieldType: f.text({ maxLength: 1000 }),
    }),
  },
  hooks: {
    // ============================================================================
    // Validation in beforeCreate
    // ============================================================================
    /**
     * Use beforeCreate for initial validation of new records.
     * This is where you validate:
     * - Required field combinations
     * - Business invariants
     * - Cross-field validation
     */
    beforeCreate: (async (context) => {
      const data = context.data as Partial<OrderFields>
      const errors: string[] = []

      // Example: Validate items array is not empty
      if (!data.items || data.items.length === 0) {
        errors.push('Order must contain at least one item')
      }

      // Example: Validate prices match items
      const calculatedSubtotal = data.items?.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      const expectedSubtotal = Number(data.subtotal)

      if (calculatedSubtotal !== expectedSubtotal) {
        errors.push(
          `Subtotal mismatch: expected ${calculatedSubtotal}, got ${expectedSubtotal}`
        )
      }

      // Example: Shipping address required for non-draft orders
      if (data.status !== 'draft' && !data.shippingAddress) {
        errors.push('Shipping address is required for non-draft orders')
      }

      // Example: Validate item prices are positive
      data.items?.forEach((item, index) => {
        if (item.price <= 0) {
          errors.push(`Item ${index + 1} has invalid price: ${item.price}`)
        }
        if (item.quantity <= 0) {
          errors.push(`Item ${index + 1} has invalid quantity: ${item.quantity}`)
        }
      })

      // Throw if validation fails
      if (errors.length > 0) {
        return error(new Error(errors.join('; ')))
      }

      return continueWith(context)
    }) as HookHandler<CreateHookContext<'orders', Record<string, ReturnType<typeof f.json>>>>,

    // ============================================================================
    // Validation in beforeUpdate
    // ============================================================================
    /**
     * Use beforeUpdate for validating changes to existing records.
     * This is where you validate:
     * - State transitions
     * - Updated field relationships
     * - Business rules that depend on current state
     */
    beforeUpdate: (async (context) => {
      const data = context.data as Partial<OrderFields>
      const previousData = context.previousData
      const errors: string[] = []

      // ============================================================================
      // State Transition Validation
      // ============================================================================

      /**
       * Define valid state transitions for order status
       */
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        draft: ['pending', 'cancelled'],
        pending: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: [], // Terminal state
        cancelled: [], // Terminal state
      }

      const currentStatus = previousData.status ?? 'draft'
      const newStatus = data.status

      if (newStatus && newStatus !== currentStatus) {
        const allowed = validTransitions[currentStatus] ?? []

        if (!allowed.includes(newStatus)) {
          errors.push(
            `Invalid status transition: cannot go from '${currentStatus}' to '${newStatus}'`
          )
        }
      }

      // ============================================================================
      // Immutable Field Validation
      // ============================================================================

      /**
       * Certain fields should not be modifiable after creation
       */
      if (data.customerId && data.customerId !== previousData.customerId) {
        errors.push('Customer ID cannot be changed after order creation')
      }

      if (data.items && JSON.stringify(data.items) !== JSON.stringify(previousData.items)) {
        errors.push('Items cannot be modified after order creation (create a new order)')
      }

      // ============================================================================
      // Cross-Field Validation
      // ============================================================================

      /**
       * If billing address differs from shipping, both must be provided
       */
      const billingDiffers = data.billingAddress &&
        JSON.stringify(data.billingAddress) !== JSON.stringify(data.shippingAddress)

      if (billingDiffers && !data.billingAddress) {
        errors.push('Billing address is required when different from shipping address')
      }

      // ============================================================================
      // Total Calculation Validation
      // ============================================================================

      /**
       * Verify that total = subtotal + tax
       */
      if (data.subtotal !== undefined || data.tax !== undefined) {
        const subtotal = Number(data.subtotal ?? previousData.subtotal)
        const tax = Number(data.tax ?? previousData.tax)
        const total = Number(data.total ?? previousData.total)

        const expectedTotal = subtotal + tax
        const tolerance = 0.01 // Allow for rounding

        if (Math.abs(expectedTotal - total) > tolerance) {
          errors.push(
            `Total calculation error: subtotal (${subtotal}) + tax (${tax}) = ${expectedTotal}, but got ${total}`
          )
        }
      }

      // ============================================================================
      // Conditional Field Requirements
      // ============================================================================

      /**
       * Shipping address required once order is shipped
       */
      if (
        (newStatus === 'shipped' || newStatus === 'delivered') &&
        !data.shippingAddress &&
        !previousData.shippingAddress
      ) {
        errors.push('Shipping address is required for shipped/delivered orders')
      }

      // Throw if validation fails
      if (errors.length > 0) {
        return error(new Error(errors.join('; ')))
      }

      return continueWith(context)
    }) as HookHandler<UpdateHookContext<'orders', Record<string, ReturnPoint<typeof f.json>>>>,
  },
})

// ============================================================================
// 2. Type Definitions
// ============================================================================

type OrderStatus = 'draft' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
}

interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

type OrderFields = InferFieldTypes<typeof orders.fields>

// ============================================================================
// 3. Using the error() Helper
// ============================================================================

/**
 * The error() helper is used to halt hook execution with a validation error.
 * When used in a before* hook, it causes the operation to fail and roll back.
 *
 * @param err - Error to throw (can be a string or Error object)
 *
 * Usage:
 * - return error(new Error('Validation failed'))
 * - return error('Simple error message')
 */

// ============================================================================
// 4. Async Validation Patterns
// ============================================================================

/**
 * Hooks support async validation, allowing database lookups.
 */
const users = collection({
  slug: 'users',
  name: 'Users',
  fields: {
    email: field({
      fieldType: f.email(),
      required: true,
    }),
    username: field({
      fieldType: f.text({ maxLength: 50 }),
      required: true,
    }),
    status: field({
      fieldType: f.select(['active', 'suspended', 'banned'] as const),
      defaultFactory: () => 'active',
    }),
  },
  hooks: {
    beforeCreate: (async (context) => {
      const data = context.data as Partial<UserFields>
      const errors: string[] = []

      // Example: Check email uniqueness (async)
      // const existingEmail = await db.query.users.findFirst({
      //   where: eq(users.email, data.email),
      // })
      // if (existingEmail) {
      //   errors.push('Email already registered')
      // }

      // Example: Check username uniqueness (async)
      // const existingUsername = await db.query.users.findFirst({
      //   where: eq(users.username, data.username),
      // })
      // if (existingUsername) {
      //   errors.push('Username already taken')
      // }

      if (errors.length > 0) {
        return error(new Error(errors.join('; ')))
      }

      return continueWith(context)
    }) as HookHandler<CreateHookContext<'users', Record<string, ReturnType<typeof f.text>>>>,

    beforeUpdate: (async (context) => {
      const data = context.data as Partial<UserFields>
      const errors: string[] = []

      // Example: Check email uniqueness excluding current user (async)
      // if (data.email && data.email !== context.previousData.email) {
      //   const existingEmail = await db.query.users.findFirst({
      //     where: and(
      //       eq(users.email, data.email),
      //       ne(users.id, context.previousData.id)
      //     ),
      //   })
      //   if (existingEmail) {
      //     errors.push('Email already registered')
      //   }
      // }

      // Example: Prevent suspension of admin users
      // if (data.status === 'suspended' && context.previousData.role === 'admin') {
      //   errors.push('Cannot suspend admin users')
      // }

      if (errors.length > 0) {
        return error(new Error(errors.join('; ')))
      }

      return continueWith(context)
    }) as HookHandler<UpdateHookContext<'users', Record<string, ReturnPoint<typeof f.text>>>>,
  },
})

type UserFields = InferFieldTypes<typeof users.fields>

// ============================================================================
// 5. Complex Validation Patterns
// ============================================================================

/**
 * Pattern: Conditional Required Fields
 * Some fields become required based on other field values
*/
const subscriptions = collection({
  slug: 'subscriptions',
  name: 'Subscriptions',
  fields: {
    plan: field({
      fieldType: f.select(['free', 'basic', 'premium', 'enterprise'] as const),
      required: true,
    }),
    paymentMethod: field({
      fieldType: f.select(['free', 'credit_card', 'paypal', 'bank_transfer'] as const),
    }),
    billingCycle: field({
      fieldType: f.select(['monthly', 'annual'] as const),
    }),
    startDate: field({
      fieldType: f.date(),
    }),
    endDate: field({
      fieldType: f.date(),
    }),
    autoRenew: field({
      fieldType: f.boolean(),
    }),
  },
  hooks: {
    beforeCreate: (async (context) => {
      const data = context.data as Partial<SubscriptionFields>
      const errors: string[] = []

      // Payment method required for paid plans
      const paidPlans = ['basic', 'premium', 'enterprise']
      if (paidPlans.includes(data.plan ?? 'free')) {
        if (!data.paymentMethod || data.paymentMethod === 'free') {
          errors.push('Payment method is required for paid plans')
        }
      }

      // Billing cycle required for paid plans
      if (paidPlans.includes(data.plan ?? 'free') && !data.billingCycle) {
        errors.push('Billing cycle is required for paid plans')
      }

      // Auto-renew only for paid plans
      if (data.autoRenew && !paidPlans.includes(data.plan ?? 'free')) {
        errors.push('Auto-renew is only available for paid plans')
      }

      if (errors.length > 0) {
        return error(new Error(errors.join('; ')))
      }

      return continueWith(context)
    }) as HookHandler<CreateHookContext<'subscriptions', Record<string, ReturnPoint<typeof f.select>>>>,
  },
})

type SubscriptionFields = InferFieldTypes<typeof subscriptions.fields>

// ============================================================================
// 6. Validation Error Types
// ============================================================================

/**
 * For more structured validation errors, create custom error types
 */
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * Example: Structured field-level validation errors
 */
// collection({
//   slug: 'products',
//   fields: {
//     name: field({ fieldType: f.text() }),
//     price: field({ fieldType: f.decimal() }),
//     category: field({ fieldType: f.text() }),
//   },
//   hooks: {
//     beforeCreate: (async (context) => {
//       const errors: ValidationError[] = []
//       const data = context.data
//
//       if (!data.name || data.name.trim().length === 0) {
//         errors.push(new ValidationError('Name is required', 'name', 'REQUIRED'))
//       }
//
//       if (data.price <= 0) {
//         errors.push(new ValidationError('Price must be positive', 'price', 'INVALID'))
//       }
//
//       if (errors.length > 0) {
//         // Could use a structured error that preserves field info
//         return error(new AggregateValidationError(errors))
//       }
//
//       return continueWith(context)
//     }),
//   },
// })

// ============================================================================
// Type Helper
// ============================================================================

type ReturnPoint<T> = T extends () => infer R ? R : never

// ============================================================================
// Usage Summary
// ============================================================================

/**
 * Validation Hook Best Practices:
 *
 * 1. Use beforeCreate for:
 *    - Required field combinations
 *    - Initial state validation
 *    - Cross-field validation on new records
 *    - Uniqueness checks
 *
 * 2. Use beforeUpdate for:
 *    - State transition validation
 *    - Immutable field checks
 *    - Conditional requirements
 *    - Business rule enforcement
 *
 * 3. Error Handling:
 *    - Use error() to fail with validation message
 *    - Consider structured errors for field-level feedback
 *    - Keep error messages user-friendly
 *
 * 4. Async Validation:
 *    - Database lookups can be async
 *    - Aggregate multiple errors before returning
 *    - Consider performance impact of async validations
 *
 * 5. Performance:
 *    - Validate early to fail fast
 *    - Consider caching for uniqueness checks
 *    - Keep validations focused and efficient
 */
