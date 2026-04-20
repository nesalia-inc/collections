/**
 * PostgreSQL Demo Example
 *
 * This example demonstrates @deessejs/collections with PostgreSQL adapter.
 * It shows:
 * - Setting up PostgreSQL connection using a simple connection string
 * - Creating collections with createCollections() and postgres() pattern
 * - Basic CRUD operations via the collection's database methods
 *
 * Environment variables required:
 * - DATABASE_URL (e.g., postgresql://user:pass@localhost:5432/mydb)
 */

import { createCollections, postgres, where, eq } from '@deessejs/collections'
import { isOk, isErr } from '@deessejs/core'
import { users, posts, type UserRecord, type PostRecord } from './collections'

// Re-export for convenience
export { users, posts }
export type { UserRecord, PostRecord }

// =============================================================================
// Main Demo
// =============================================================================

async function main() {
  console.log('='.repeat(60))
  console.log('@deessejs/collections - PostgreSQL Demo')
  console.log('='.repeat(60))
  console.log()

  // Create collections with database access using postgres() pattern
  // Connection string auto-creates the pool with default settings
  const result = await createCollections({
    collections: [users, posts],
    db: postgres(process.env.DATABASE_URL!),
  })

  if (isErr(result)) {
    console.error('Failed to create collections:', result.error)
    process.exit(1)
  }

  const { db } = result.value

  // Use CLI for schema push: npx @deessejs/collections push
  // NOT db.$push()

  // =============================================================================
  // CREATE - Insert new users
  // =============================================================================
  console.log('\n--- CREATE Users ---\n')

  const createUserResult1 = await db.users.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      bio: 'Software developer and open source enthusiast.',
      active: true,
    },
  })
  const newUser = isOk(createUserResult1) ? createUserResult1.value : null
  console.log('Created user:', createUserResult1)

  const createUserResult2 = await db.users.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@example.com',
      bio: 'Technical writer and documentation specialist.',
      active: true,
    },
  })
  const newUser2 = isOk(createUserResult2) ? createUserResult2.value : null
  console.log('Created user:', createUserResult2)

  // =============================================================================
  // CREATE - Insert posts
  // =============================================================================
  console.log('\n--- CREATE Posts ---\n')

  const createPostResult1 = await db.posts.create({
    data: {
      title: 'Getting Started with PostgreSQL',
      content: 'PostgreSQL is a powerful, open source object-relational database system...',
      published: true,
      viewCount: 42,
    },
  })
  const newPost = isOk(createPostResult1) ? createPostResult1.value : null
  console.log('Created post:', createPostResult1)

  const createPostResult2 = await db.posts.create({
    data: {
      title: 'Working with TypeScript',
      content: 'TypeScript adds static typing to JavaScript...',
      published: true,
      viewCount: 128,
    },
  })
  const newPost2 = isOk(createPostResult2) ? createPostResult2.value : null
  console.log('Created post:', createPostResult2)

  // =============================================================================
  // READ - Find many users and posts
  // =============================================================================
  console.log('\n--- READ Operations (findMany) ---\n')

  const allUsers = await db.users.findMany()
  console.log('All users:', allUsers)

  const allPosts = await db.posts.findMany()
  console.log('\nAll posts:', allPosts)

  // =============================================================================
  // READ - Find active users only
  // =============================================================================
  console.log('\n--- READ - Find Active Users ---\n')

  const activeUsers = await db.users.findMany({
    // Note: Query builder pattern depends on implementation
  })
  console.log('Active users (using default findMany):', activeUsers)

  // =============================================================================
  // READ - Find published posts
  // =============================================================================
  console.log('\n--- READ - Find Published Posts ---\n')

  const publishedPosts = await db.posts.findMany()
  console.log('Published posts:', publishedPosts)

  // =============================================================================
  // READ - Find user by ID
  // =============================================================================
  console.log('\n--- READ - Find User by ID ---\n')

  // Note: findUnique expects { where: { id: string } } - direct ID lookup
  // For predicate-based queries, use findFirst
  const foundUserResult = await db.users.findFirst({
    where: where((p) => [eq(p.id, newUser!.id)]),
  })
  const foundUser = isOk(foundUserResult) ? foundUserResult.value : null
  console.log('Found user by id:', foundUserResult)

  // =============================================================================
  // COUNT & EXISTS
  // =============================================================================
  console.log('\n--- COUNT & EXISTS ---\n')

  const totalUsers = await db.users.count()
  console.log('Total users count:', totalUsers)

  const totalPosts = await db.posts.count()
  console.log('Total posts count:', totalPosts)

  const publishedCount = await db.posts.count()
  console.log('Published posts count:', publishedCount)

  // =============================================================================
  // UPDATE - Update a user
  // =============================================================================
  console.log('\n--- UPDATE Operations ---\n')

  const updateUserResult = await db.users.update({
    where: where((p) => [eq(p.id, newUser!.id)]),
    data: {
      bio: 'Senior software developer and open source enthusiast.',
    },
  })
  if (isOk(updateUserResult)) {
    console.log('Updated user:', updateUserResult.value)
  } else {
    console.error('Update user failed:', updateUserResult.error)
  }

  // Update post view count
  // Note: Field names use snake_case as that's how they appear in the database
  const updatePostResult = await db.posts.update({
    where: where((p) => [eq(p.id, newPost!.id)]),
    data: {
      view_count: 100,
    },
  })
  if (isOk(updatePostResult)) {
    console.log('Updated post view count:', updatePostResult.value)
  } else {
    console.error('Update post failed:', updatePostResult.error)
  }

  // =============================================================================
  // DELETE - Delete a post (soft delete concept via published flag)
  // =============================================================================
  console.log('\n--- DELETE Operation ---\n')

  // Unpublish a post instead of hard delete
  const unpublishedPostResult = await db.posts.update({
    where: where((p) => [eq(p.id, newPost!.id)]),
    data: {
      published: false,
    },
  })
  if (isOk(unpublishedPostResult)) {
    console.log('Unpublished post:', unpublishedPostResult.value)
  } else {
    console.error('Unpublish post failed:', unpublishedPostResult.error)
  }

  // =============================================================================
  // Summary
  // =============================================================================
  console.log('\n' + '='.repeat(60))
  console.log('PostgreSQL Demo complete!')
  console.log('='.repeat(60))
  console.log('\nThis demo showed:')
  console.log('  1. PostgreSQL connection using simple connection string')
  console.log('  2. createCollections() with postgres() pattern')
  console.log('  3. Basic CRUD operations on users and posts collections')
  console.log('\nSchema push is done via CLI: npx @deessejs/collections push')
}

// Run the demo
main().catch(console.error)
