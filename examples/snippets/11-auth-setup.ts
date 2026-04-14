/**
 * @deessejs/collections Snippet 11: Authentication Setup
 *
 * This example demonstrates how to set up authentication-related
 * collections and patterns in @deessejs/collections.
 *
 * This includes:
 * - User accounts
 * - Sessions/tokens
 * - Roles and permissions
 * - Password handling (with hooks)
 *
 * Run with: npx tsx examples/snippets/11-auth-setup.ts
 */

import { collection, field, f, defineConfig } from '@deessejs/collections'
import type { CollectionHooks, CreateHookContext } from '@deessejs/collections'
import { continueWith } from '@deessejs/collections'

// =============================================================================
// User Accounts
// =============================================================================

/**
 * Core users collection for authentication.
 * In a real application, password hashing would be done in hooks
 * using a library like bcrypt or argon2.
 */
const users = collection({
  slug: 'users',
  fields: {
    // Using email as the primary identifier
    userId: field({
      fieldType: f.uuid(),
      required: true,
      defaultFactory: () => crypto.randomUUID(),
    }),
    email: field({
      fieldType: f.email(),
      required: true,
      unique: true,
    }),
    passwordHash: field({
      fieldType: f.text(),
      required: true,
    }),
    passwordChangedAt: field({
      fieldType: f.timestamp(),
    }),
    // Account status
    status: field({
      fieldType: f.select(['active', 'suspended', 'pending', 'banned']),
      required: true,
      defaultValue: 'pending' as const,
    }),
    // Email verification
    emailVerified: field({
      fieldType: f.boolean(),
      defaultValue: false,
    }),
    emailVerificationToken: field({
      fieldType: f.text(),
    }),
    emailVerificationTokenExpiresAt: field({
      fieldType: f.timestamp(),
    }),
    // Password reset
    resetPasswordToken: field({
      fieldType: f.text(),
    }),
    resetPasswordTokenExpiresAt: field({
      fieldType: f.timestamp(),
    }),
    // Account lockout (for brute force protection)
    failedLoginAttempts: field({
      fieldType: f.number(),
      defaultValue: 0,
    }),
    lockedUntil: field({
      fieldType: f.timestamp(),
    }),
    // Security
    lastLoginAt: field({
      fieldType: f.timestamp(),
    }),
    lastLoginIp: field({
      fieldType: f.text(),
    }),
  },
  hooks: {
    beforeCreate: async (context) => {
      // Hash password before storing
      // In real usage: context.data.passwordHash = await bcrypt.hash(plainPassword)
      console.log('[Auth] Would hash password for:', context.data.email)

      // Generate email verification token
      const verificationToken = crypto.randomUUID()
      context.data.emailVerificationToken = verificationToken
      context.data.emailVerificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      return continueWith(context)
    },
  },
})

// =============================================================================
// User Profiles (One-to-One with Users)
// =============================================================================

/**
 * Profile information separate from authentication data.
 * This allows for different update patterns.
 */
const profiles = collection({
  slug: 'profiles',
  fields: {
    userId: field({
      fieldType: f.relation(),
      required: true,
      unique: true, // One profile per user
    }),
    firstName: field({
      fieldType: f.text(),
    }),
    lastName: field({
      fieldType: f.text(),
    }),
    displayName: field({
      fieldType: f.text(),
    }),
    avatar: field({
      fieldType: f.url(),
    }),
    bio: field({
      fieldType: f.text(),
    }),
    dateOfBirth: field({
      fieldType: f.date(),
    }),
    phone: field({
      fieldType: f.text(),
    }),
    // Preferences
    preferences: field({
      fieldType: f.jsonb(), // JSON object for flexible preferences
    }),
  },
})

// =============================================================================
// Roles and Permissions
// =============================================================================

/**
 * Roles collection - defines available roles
 */
const roles = collection({
  slug: 'roles',
  fields: {
    name: field({
      fieldType: f.text(),
      required: true,
      unique: true,
    }),
    slug: field({
      fieldType: f.text(),
      required: true,
      unique: true,
    }),
    description: field({
      fieldType: f.text(),
    }),
    // Permissions as JSON array
    // Example: ['users:read', 'users:write', 'posts:publish']
    permissions: field({
      fieldType: f.jsonb(),
    }),
    isSystem: field({
      fieldType: f.boolean(),
      defaultValue: false, // System roles can't be deleted
    }),
  },
  hooks: {
    beforeCreate: async (context) => {
      // Ensure system roles are created properly
      if (context.data.isSystem) {
        console.log('[Roles] Creating system role:', context.data.name)
      }
      return continueWith(context)
    },
  },
})

/**
 * User roles - junction table for users <-> roles (many-to-many)
 */
const userRoles = collection({
  slug: 'user-roles',
  fields: {
    userId: field({
      fieldType: f.relation(),
      required: true,
    }),
    roleId: field({
      fieldType: f.relation(),
      required: true,
    }),
    grantedBy: field({
      fieldType: f.uuid(),
    }),
    grantedAt: field({
      fieldType: f.timestamp(),
      defaultFactory: () => new Date(),
    }),
    expiresAt: field({
      fieldType: f.timestamp(),
    }),
  },
})

// =============================================================================
// Sessions
// =============================================================================

/**
 * Active sessions for users.
 * Each session represents a logged-in device/browser.
 */
const sessions = collection({
  slug: 'sessions',
  fields: {
    userId: field({
      fieldType: f.relation(),
      required: true,
    }),
    // Unique session token (stored in cookie/header)
    token: field({
      fieldType: f.text(),
      required: true,
      unique: true,
      indexed: true,
    }),
    // Refresh token for token rotation
    refreshToken: field({
      fieldType: f.text(),
      unique: true,
    }),
    // Session metadata
    userAgent: field({
      fieldType: f.text(),
    }),
    ipAddress: field({
      fieldType: f.text(),
    }),
    // Security
    expiresAt: field({
      fieldType: f.timestamp(),
      required: true,
    }),
    lastActivityAt: field({
      fieldType: f.timestamp(),
      defaultFactory: () => new Date(),
    }),
    // Revocation
    revokedAt: field({
      fieldType: f.timestamp(),
    }),
    revokedReason: field({
      fieldType: f.text(),
    }),
  },
  hooks: {
    beforeCreate: async (context) => {
      // Generate session token
      context.data.token = crypto.randomUUID() + '-' + crypto.randomUUID()

      // Set expiration (default: 7 days)
      if (!context.data.expiresAt) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)
        context.data.expiresAt = expiresAt
      }

      console.log('[Session] Creating new session for user:', context.data.userId)
      return continueWith(context)
    },
  },
})

// =============================================================================
// API Keys
// =============================================================================

/**
 * API keys for programmatic access (CI/CD, integrations, etc.)
 */
const apiKeys = collection({
  slug: 'api-keys',
  fields: {
    userId: field({
      fieldType: f.relation(),
      required: true,
    }),
    name: field({
      fieldType: f.text(),
      required: true,
    }),
    // The actual key (hashed in storage)
    keyHash: field({
      fieldType: f.text(),
      required: true,
    }),
    // Key prefix for identification (e.g., "sk_live_abc123")
    keyPrefix: field({
      fieldType: f.text(),
      required: true,
    }),
    // Permissions/scopes for this key
    scopes: field({
      fieldType: f.array(f.text()),
    }),
    // Rate limiting
    rateLimit: field({
      fieldType: f.number(),
    }),
    // Status
    status: field({
      fieldType: f.select(['active', 'revoked', 'expired']),
      required: true,
      defaultValue: 'active' as const,
    }),
    // Timestamps
    lastUsedAt: field({
      fieldType: f.timestamp(),
    }),
    expiresAt: field({
      fieldType: f.timestamp(),
    }),
    created: field({
      fieldType: f.timestamp(),
      defaultFactory: () => new Date(),
    }),
  },
  hooks: {
    beforeCreate: async (context) => {
      // Generate key and store hash
      const rawKey = 'sk_' + crypto.randomUUID().replace(/-/g, '')
      const keyPrefix = rawKey.substring(0, 12) // First 12 chars as prefix

      // In real usage:
      // context.data.keyHash = await bcrypt.hash(rawKey)
      context.data.keyHash = 'hashed_' + rawKey
      context.data.keyPrefix = keyPrefix

      console.log('[API Key] Created key with prefix:', keyPrefix)
      console.log('[API Key] Raw key (show once):', rawKey)

      return continueWith(context)
    },
  },
})

// =============================================================================
// Audit Log
// =============================================================================

/**
 * Audit log for security-critical operations.
 * Tracks who did what and when.
 */
const auditLogs = collection({
  slug: 'audit-logs',
  fields: {
    // Actor (who performed the action)
    userId: field({
      fieldType: f.uuid(),
    }),
    // Action details
    action: field({
      fieldType: f.text(),
      required: true,
      // Examples: 'user.login', 'user.logout', 'user.update', 'api_key.create'
    }),
    resource: field({
      fieldType: f.text(),
      required: true,
      // Examples: 'users', 'sessions', 'api-keys'
    }),
    resourceId: field({
      fieldType: f.text(),
    }),
    // Change details
    changes: field({
      fieldType: f.jsonb(),
      // Example: { field: 'status', old: 'active', new: 'suspended' }
    }),
    // Context
    ipAddress: field({
      fieldType: f.text(),
    }),
    userAgent: field({
      fieldType: f.text(),
    }),
    // Result
    status: field({
      fieldType: f.select(['success', 'failure']),
      required: true,
    }),
    errorMessage: field({
      fieldType: f.text(),
    }),
    timestamp: field({
      fieldType: f.timestamp(),
      required: true,
      defaultFactory: () => new Date(),
    }),
  },
  hooks: {
    beforeCreate: async (context) => {
      console.log('[Audit] Log:', context.data.action, 'by user:', context.data.userId)
      return continueWith(context)
    },
  },
})

// =============================================================================
// Building the Auth Schema
// =============================================================================

/**
 * Complete authentication and authorization schema
 */
const authSchema = defineConfig({
  collections: [
    users,
    profiles,
    roles,
    userRoles,
    sessions,
    apiKeys,
    auditLogs,
  ],
})

// =============================================================================
// Authentication Flow Examples (Pseudo-code)
// =============================================================================

/**
 * Example: User Registration Flow
 *
 * 1. Validate input (email, password strength)
 * 2. Check if email already exists
 * 3. Create user with hashed password
 * 4. Create profile (optional)
 * 5. Send verification email
 *
 * await db.create(users, {
 *   email: 'user@example.com',
 *   passwordHash: await bcrypt.hash(plainPassword),
 *   status: 'pending',
 * })
 */

/**
 * Example: User Login Flow
 *
 * 1. Find user by email
 * 2. Check if account is locked
 * 3. Verify password
 * 4. Update failed login attempts
 * 5. Create session
 * 6. Log audit event
 *
 * const user = await db.findFirst(users, { where: { email } })
 * if (user.lockedUntil > new Date()) throw new Error('Account locked')
 * if (!await bcrypt.compare(password, user.passwordHash)) {
 *   await db.update(users, { failedLoginAttempts: user.failedLoginAttempts + 1 }, { id: user.id })
 *   throw new Error('Invalid credentials')
 * }
 * const session = await db.create(sessions, { userId: user.id, ... })
 */

/**
 * Example: Session Validation
 *
 * 1. Extract token from Authorization header
 * 2. Find session by token
 * 3. Check if session is expired or revoked
 * 4. Check user status
 * 5. Update last activity
 *
 * const session = await db.findFirst(sessions, { where: { token } })
 * if (!session || session.expiresAt < new Date() || session.revokedAt) {
 *   throw new Error('Invalid or expired session')
 * }
 */

/**
 * Example: Permission Check
 *
 * 1. Get user's roles
 * 2. Collect all permissions from roles
 * 3. Check if required permission is in set
 *
 * const userRoles = await db.findMany(userRoles, { where: { userId } })
 * const permissions = new Set(userRoles.flatMap(r => r.role.permissions))
 * if (!permissions.has('posts:publish')) throw new Error('Forbidden')
 */

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Authentication Setup ===')
console.log('')
console.log('Auth schema collections:')
for (const [slug, collection] of Object.entries(authSchema.collections)) {
  console.log(`  - ${slug}: ${Object.keys(collection.fields).length} fields`)
}
console.log('')
console.log('Authentication features:')
console.log('- Users with email/password authentication')
console.log('- Email verification flow')
console.log('- Password reset flow')
console.log('- Account lockout for brute-force protection')
console.log('- Sessions for web/mobile clients')
console.log('- API keys for programmatic access')
console.log('- Roles and permissions system')
console.log('- Comprehensive audit logging')
console.log('')
console.log('Authentication setup examples complete!')
