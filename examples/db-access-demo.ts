/**
 * DbAccess Demo - Full CRUD Flow with createCollections
 *
 * This example demonstrates how to use the createCollections API
 * for type-safe, collection-oriented database operations.
 *
 * This example shows:
 * - How to set up createCollections with collections
 * - Complete CRUD operations using the db.<collection> API
 * - Query options (where, orderBy, limit, select)
 * - Pagination support (offset and cursor)
 * - Count and exists utilities
 *
 * Run with: npx tsx examples/db-access-demo.ts
 */

import { isOk, isErr } from '@deessejs/core'
import { collection, field, f, where, eq, desc, orderBy, and, or, not, inList, sqlite, createCollections } from '@deessejs/collections'
import { offset, page, cursor } from '@deessejs/collections'
import { createSqliteSchema } from '@deessejs/collections/adapter/sqlite'

// Common database connection helper
import { createSqliteConnection } from './lib/db'

// =============================================================================
// Step 1: Define Collections
// =============================================================================

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.richtext() }),
    published: field({ fieldType: f.boolean(), defaultValue: false }),
    authorId: field({ fieldType: f.uuid() }),
  },
})

const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    email: field({ fieldType: f.email(), required: true, unique: true }),
    bio: field({ fieldType: f.text() }),
  },
})

// =============================================================================
// Entity Types for Where Clause Builder
// =============================================================================

interface PostEntity {
  id: string
  title: string
  content?: string
  published: boolean
  authorId: string
}

interface UserEntity {
  id: string
  name: string
  email: string
  bio?: string
}

// =============================================================================
// Step 2: Create Collections with SQLite In-Memory Database
// =============================================================================

// Create in-memory SQLite database using common connection helper
const { db: sqliteDb } = createSqliteConnection({ path: ':memory:' })

// Create collections with SQLite database
const collectionsResult = createCollections({
  collections: [posts, users],
  db: sqlite(sqliteDb),
})

if (isErr(collectionsResult)) {
  console.error('Failed to create collections:', collectionsResult.error)
  process.exit(1)
}

const { db } = collectionsResult.value

// =============================================================================
// Step 3: CREATE Operations
// =============================================================================

async function createExamples() {
  console.log('\n=== CREATE Operations ===\n')

  // Create a single user
  const newUser = await db.users.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Tech writer and developer',
    },
  })

  if (isOk(newUser)) {
    console.log('Created user:', newUser.value.id, newUser.value.name, newUser.value.email)
  } else {
    console.error('Error creating user:', newUser.error)
  }

  // Create a second user
  const newUser2 = await db.users.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      bio: 'Software engineer',
    },
  })

  if (isOk(newUser2)) {
    console.log('Created user:', newUser2.value.id, newUser2.value.name, newUser2.value.email)
  } else {
    console.error('Error creating user:', newUser2.error)
  }

  // Create a post
  const userId = isOk(newUser) ? newUser.value.id : 'unknown'
  const newPost = await db.posts.create({
    data: {
      title: 'Hello World',
      content: 'This is my first blog post!',
      published: true,
      authorId: userId,
    },
  })

  if (isOk(newPost)) {
    console.log('Created post:', newPost.value.id, newPost.value.title)
  } else {
    console.error('Error creating post:', newPost.error)
  }

  // Create multiple posts in batch
  const batchResult = await db.posts.createMany({
    data: [
      { title: 'Post 1', content: 'Content for post 1', published: false, authorId: userId },
      { title: 'Post 2', content: 'Content for post 2', published: true, authorId: userId },
      { title: 'Post 3', content: 'Content for post 3', published: false, authorId: userId },
    ],
  })

  if (isOk(batchResult)) {
    console.log(`Created ${batchResult.value.count} posts with IDs:`, batchResult.value.insertedIds)
  } else {
    console.error('Error creating posts:', batchResult.error)
  }
}

// =============================================================================
// Step 4: READ Operations
// =============================================================================

async function readExamples() {
  console.log('\n=== READ Operations ===\n')

  // Find a single record by ID
  const allPosts = await db.posts.findMany({})
  if (allPosts.length > 0) {
    const post = await db.posts.findUnique({
      where: { id: allPosts[0].id as string | number },
    })
    if (post) {
      console.log('Found post by ID:', post.id, post.title)
    }
  }

  // Find first record matching criteria
  const firstPublished = await db.posts.findFirst({
    where: where<PostEntity>((p) => [eq(p.published, true)]),
  })
  if (firstPublished) {
    console.log('First published post:', firstPublished.title)
  }

  // Find many records with filtering
  const publishedPosts = await db.posts.findMany({
    where: where<PostEntity>((p) => [eq(p.published, true)]),
  })
  console.log('Published posts count:', publishedPosts.length)
  for (const post of publishedPosts) {
    console.log('  -', post.id, post.title)
  }

  // Find with orderBy and limit
  const recentPosts = await db.posts.findMany({
    orderBy: orderBy<PostEntity>((p) => [desc(p.createdAt)]),
    limit: 10,
  })
  console.log('Recent posts (ordered by createdAt desc, limit 10):', recentPosts.length)

  // Find with field selection
  const titles = await db.posts.findMany({
    select: ['id', 'title'],
  })
  console.log('Post titles only:', titles.map((t: any) => ({ id: t.id, title: t.title })))

  // Paginated find with offset
  const page1 = await db.posts.find({
    where: where<PostEntity>((p) => [eq(p.published, true)]),
    orderBy: orderBy<PostEntity>((p) => [desc(p.createdAt)]),
    pagination: page(1, 2),
  })
  console.log('Page 1 data length:', page1.current.data.length)
  console.log('Page 1 total:', page1.current.total)
  console.log('Page 1 hasNext:', page1.hasNext)
  console.log('Page 1 hasPrevious:', page1.hasPrevious)
}

// =============================================================================
// Step 5: UPDATE Operations
// =============================================================================

async function updateExamples() {
  console.log('\n=== UPDATE Operations ===\n')

  // Get a post to update
  const allPosts = await db.posts.findMany({})
  if (allPosts.length === 0) {
    console.log('No posts to update')
    return
  }

  const postToUpdate = allPosts[0]

  // Update records matching a predicate
  const updateResult = await db.posts.update({
    where: where<PostEntity>((p) => [eq(p.id, postToUpdate.id as string)]),
    data: {
      published: true,
    },
  })

  if (isOk(updateResult)) {
    console.log(`Updated ${updateResult.value.count} post(s)`)
    for (const record of updateResult.value.records) {
      console.log('  Updated:', record.id, record.title, '-> published:', record.published)
    }
  } else {
    console.error('Error updating posts:', updateResult.error)
  }

  // Update with multiple conditions using and()
  const multiUpdate = await db.posts.update({
    where: where<PostEntity>((p) => [
      and(
        eq(p.published, false),
        inList(p.authorId, [postToUpdate.authorId as string])
      ),
    ]),
    data: {
      title: 'Draft Title Updated',
    },
  })

  if (isOk(multiUpdate)) {
    console.log(`Updated ${multiUpdate.value.count} draft post(s) by author`)
  }
}

// =============================================================================
// Step 6: DELETE Operations
// =============================================================================

async function deleteExamples() {
  console.log('\n=== DELETE Operations ===\n')

  // Get a post to delete
  const allPosts = await db.posts.findMany({})
  if (allPosts.length === 0) {
    console.log('No posts to delete')
    return
  }

  const postToDelete = allPosts[allPosts.length - 1] // Delete the last one

  // Delete records matching a predicate
  const deleted = await db.posts.delete({
    where: where<PostEntity>((p) => [eq(p.id, postToDelete.id as string)]),
  })

  if (isOk(deleted)) {
    console.log('Deleted post:', deleted.value.records[0].title)
    console.log('Delete count:', deleted.value.count)
  } else {
    console.error('Error deleting post:', deleted.error)
  }

  // Delete multiple records
  const result = await db.posts.delete({
    where: where<PostEntity>((p) => [eq(p.published, false)]),
  })

  if (isOk(result)) {
    console.log(`Deleted ${result.value.count} unpublished posts`)
  }
}

// =============================================================================
// Step 7: Utility Operations
// =============================================================================

async function utilityExamples() {
  console.log('\n=== Utility Operations ===\n')

  // Count records
  const totalPosts = await db.posts.count()
  console.log('Total posts:', totalPosts)

  const totalUsers = await db.users.count()
  console.log('Total users:', totalUsers)

  const publishedCount = await db.posts.count({
    where: where<PostEntity>((p) => [eq(p.published, true)]),
  })
  console.log('Published posts:', publishedCount)

  // Check if any record exists
  const hasUnpublished = await db.posts.exists({
    where: where<PostEntity>((p) => [eq(p.published, false)]),
  })
  console.log('Has unpublished drafts:', hasUnpublished)

  const hasPublished = await db.posts.exists({
    where: where<PostEntity>((p) => [eq(p.published, true)]),
  })
  console.log('Has published posts:', hasPublished)
}

// =============================================================================
// Run Demo
// =============================================================================

async function runDemo() {
  // Push schema to create tables before running queries
  await db.$push()

  console.log('==============================================')
  console.log('  createCollections Full CRUD Flow Demo')
  console.log('  (SQLite in-memory database)')
  console.log('==============================================')

  await createExamples()
  await readExamples()
  await updateExamples()
  await deleteExamples()
  await utilityExamples()

  console.log('\n==============================================')
  console.log('  Demo Complete')
  console.log('==============================================')
}

runDemo().catch(console.error)
