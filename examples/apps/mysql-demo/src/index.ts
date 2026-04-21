/**
 * MySQL Demo Example
 *
 * This example demonstrates @deessejs/collections with MySQL database.
 * It shows:
 * - Using mysql() helper for MySQL connections
 * - createCollections() with MySQL adapter
 * - db.$push() to sync schema to database
 * - CRUD operations with MySQL
 *
 * Prerequisites:
 * - MySQL server running (default: localhost:3306)
 * - Database created (default: test)
 * - User with permissions (default: root, no password)
 *
 * To customize connection, set environment variables:
 * - MYSQL_HOST: hostname (default: localhost)
 * - MYSQL_PORT: port (default: 3306)
 * - MYSQL_USER: username (default: root)
 * - MYSQL_PASSWORD: password (default: empty)
 * - MYSQL_DATABASE: database name (default: test)
 */

import { createCollections, mysql, collection, field, f, where, eq } from '@deessejs/collections'
import { isOk, isErr } from '@deessejs/core'
import { createMysqlConnection, closeConnection } from '../../../lib/db'

// =============================================================================
// Collection Definition
// =============================================================================

const users = collection({
  slug: 'users',
  name: 'Users',
  admin: {
    description: 'User accounts with profile information',
    icon: 'user',
  },
  fields: {
    name: field({
      fieldType: f.text({ minLength: 1, maxLength: 100 }),
      required: true,
    }),
    email: field({
      fieldType: f.text({ minLength: 5, maxLength: 255 }),
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

// =============================================================================
// Database Setup
// =============================================================================

// Create MySQL connection using common helper
// Supports environment variables: MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_URL
const { pool, db: mysqlPool } = createMysqlConnection()

console.log('='.repeat(60))
console.log('@deessejs/collections - MySQL Demo')
console.log('='.repeat(60))
console.log(`Connecting to MySQL at ${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || '3306'}/${process.env.MYSQL_DATABASE || 'test'}`)

// Create the collections with MySQL connection
const result = createCollections({
  collections: [users],
  db: mysql(mysqlPool),
})

if (!isOk(result)) {
  console.error('Failed to create collections:', result.error)
  process.exit(1)
}

const { db } = result.value

/**
 * Main entry point - demonstrates CRUD operations
 */
async function main() {
  console.log('\nMake sure to push schema via CLI: npx @deessejs/collections push')
  console.log('db.$push() is no longer available\n')

  // =============================================================================
  // CREATE - Insert new users
  // =============================================================================
  console.log('--- CREATE Operations ---\n')

  const user1 = await db.users.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      bio: 'Software engineer with 10 years of experience',
      active: true,
    },
  })
  console.log('Created user 1:', user1)

  const user2 = await db.users.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      bio: 'Product manager and tech enthusiast',
      active: true,
    },
  })
  console.log('Created user 2:', user2)

  const user3 = await db.users.create({
    data: {
      name: 'Carol White',
      email: 'carol@example.com',
      active: false,
    },
  })
  console.log('Created user 3 (inactive):', user3)

  // =============================================================================
  // READ - Find users
  // =============================================================================
  console.log('\n--- READ Operations (findMany) ---\n')

  const allUsers = await db.users.findMany()
  console.log('All users:', allUsers)

  // Find active users only
  const activeUsers = await db.users.findMany({
    where: where((p) => [eq(p.active, true)]),
  })
  console.log('\nActive users:', activeUsers)

  // Find user by email
  const foundUser = await db.users.findUnique({
    where: where((p) => [eq(p.email, 'alice@example.com')]),
  })
  console.log('\nFound user by email:', foundUser)

  // Find first inactive user
  const inactiveUser = await db.users.findFirst({
    where: where((p) => [eq(p.active, false)]),
  })
  console.log('First inactive user:', inactiveUser)

  // =============================================================================
  // UPDATE - Modify users
  // =============================================================================
  console.log('\n--- UPDATE Operations ---\n')

  // Update Alice's bio
  const updatedUser1 = await db.users.update({
    where: where((p) => [eq(p.id, user1.id)]),
    data: {
      bio: 'Senior software engineer specializing in TypeScript and Node.js',
    },
  })
  console.log('Updated user 1:', updatedUser1)

  // Deactivate Bob
  const updatedUser2 = await db.users.update({
    where: where((p) => [eq(p.id, user2.id)]),
    data: {
      active: false,
    },
  })
  console.log('Deactivated user 2:', updatedUser2)

  // =============================================================================
  // READ - After updates
  // =============================================================================
  console.log('\n--- READ After Updates ---\n')

  const usersAfterUpdate = await db.users.findMany()
  console.log('All users after updates:', usersAfterUpdate)

  const nowInactiveUsers = await db.users.findMany({
    where: where((p) => [eq(p.active, false)]),
  })
  console.log('\nInactive users:', nowInactiveUsers)

  // =============================================================================
  // COUNT & EXISTS
  // =============================================================================
  console.log('\n--- COUNT & EXISTS ---\n')

  const totalUsers = await db.users.count()
  console.log('Total users count:', totalUsers)

  const activeCount = await db.users.count({
    where: where((p) => [eq(p.active, true)]),
  })
  console.log('Active users count:', activeCount)

  const hasInactiveUsers = await db.users.exists({
    where: where((p) => [eq(p.active, false)]),
  })
  console.log('Has inactive users:', hasInactiveUsers)

  // =============================================================================
  // DELETE - Remove a user
  // =============================================================================
  console.log('\n--- DELETE Operation ---\n')

  const deletedUser = await db.users.delete({
    where: where((p) => [eq(p.id, user3.id)]),
  })
  console.log('Deleted user 3:', deletedUser)

  const remainingUsers = await db.users.findMany()
  console.log('\nRemaining users after delete:', remainingUsers)

  // =============================================================================
  // CREATE MANY - Batch insert
  // =============================================================================
  console.log('\n--- CREATE MANY Operation ---\n')

  const batchResult = await db.users.createMany({
    data: [
      { name: 'David Brown', email: 'david@example.com', active: true },
      { name: 'Eve Davis', email: 'eve@example.com', active: true },
      { name: 'Frank Miller', email: 'frank@example.com', active: false },
    ],
  })
  console.log('Batch create result:', batchResult)

  const allUsersAfterBatch = await db.users.findMany()
  console.log('\nAll users after batch create:', allUsersAfterBatch)

  // =============================================================================
  // Cleanup - Close connection
  // =============================================================================
  console.log('\n--- Cleanup ---\n')

  // Close the connection pool
  await closeConnection(pool)

  console.log('Demo complete!')
  console.log('='.repeat(60))

  // Exit successfully
  process.exit(0)
}

// Run the demo
main().catch(async (error) => {
  console.error('Error running demo:', error)
  // Ensure pool is closed on error
  try {
    await closeConnection(pool)
  } catch {
    // Ignore cleanup errors
  }
  process.exit(1)
})