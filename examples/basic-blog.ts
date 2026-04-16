/**
 * Basic Blog Example
 *
 * This example demonstrates the complete flow from Collection definition
 * to CRUD operations using the @deessejs/collections library.
 *
 * It shows:
 * - How to define a collection with various field types
 * - How to generate database schemas for PostgreSQL and SQLite
 * - How to set up an in-memory SQLite database
 * - How to execute CRUD operations with createCollections
 */

// =============================================================================
// Step 1: Import from the collections library
// =============================================================================

import { collection, field, f, where, eq, createCollections, sqlite } from '@deessejs/collections'
import { isOk, isErr } from '@deessejs/core'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'

// Database adapters for schema generation
import { createPostgresSchema } from '@deessejs/collections/adapter/postgresql'
import { createSqliteSchema } from '@deessejs/collections/adapter/sqlite'

// =============================================================================
// Step 2: Define a Collection (Blog Post)
// =============================================================================

// Collections are the core building block. They define the structure of your data.
// Each collection has a unique 'slug' and a set of 'fields'.

const posts = collection({
  slug: 'posts',
  fields: {
    // A required text field for the post title
    title: field({ fieldType: f.text(), required: true }),

    // A rich text field for the main content
    content: field({ fieldType: f.richtext() }),

    // A boolean field with a default value (not published yet)
    published: field({ fieldType: f.boolean(), defaultValue: false }),
  },
})

// Entity type for Where clause builder
interface PostEntity {
  id: string
  title: string
  content?: string
  published: boolean
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// Step 3: Generate Database Schemas
// =============================================================================

// The collection definition is database-agnostic. You can generate
// a Drizzle-compatible schema for either PostgreSQL or SQLite.

// PostgreSQL schema - use this with pg driver or postgres.js
const pgSchema = createPostgresSchema([posts])

// SQLite schema - use this with better-sqlite3 or libsql
const sqliteSchema = createSqliteSchema([posts])

// The generated schemas are Drizzle schema objects that you can pass
// to drizzle(connection, { schema: pgSchema }) to get a typed DB instance.

// =============================================================================
// Step 4: Set up SQLite In-Memory Database
// =============================================================================

// Create an in-memory SQLite database using better-sqlite3
const sqliteDb = new Database(':memory:')
const dbInstance = drizzle(sqliteDb, { schema: sqliteSchema })

// Create type-safe collections using the SQLite database
const collectionsResult = createCollections({
  collections: [posts],
  db: sqlite(sqliteDb),
})

if (isErr(collectionsResult)) {
  console.error('Failed to create collections:', collectionsResult.error)
  process.exit(1)
}

const { db } = collectionsResult.value

// =============================================================================
// Step 5: Execute CRUD Operations
// =============================================================================

async function main() {
  // Push schema to create tables before running queries
  await db.$push()

  console.log('\n=== Basic Blog Example - SQLite In-Memory ===\n')

  // -------------------------------------------------------------------------
  // Schema Visualization
  // -------------------------------------------------------------------------
  console.log('--- Schema Structure ---')
  console.log('PostgreSQL schema keys:', Object.keys(pgSchema))
  console.log('SQLite schema keys:', Object.keys(sqliteSchema))
  console.log('')
  console.log('SQLite posts table columns:')
  const postsTable = sqliteSchema.posts
  console.log('  Available columns on table:', Object.keys(postsTable))
  console.log('')

  // -------------------------------------------------------------------------
  // Create - Insert a new post
  // -------------------------------------------------------------------------
  console.log('--- Create ---')

  const createResult = await db.posts.create({
    data: {
      title: 'Hello World',
      content: 'This is my first blog post!',
      published: true,
    },
  })

  if (isOk(createResult)) {
    console.log('Created post:', createResult.value)
  } else {
    console.error('Failed to create post:', createResult.error)
  }

  // -------------------------------------------------------------------------
  // Create another post (unpublished)
  // -------------------------------------------------------------------------
  const createResult2 = await db.posts.create({
    data: {
      title: 'Draft Post',
      content: 'This is a draft',
      published: false,
    },
  })

  if (isOk(createResult2)) {
    console.log('Created draft:', createResult2.value)
  } else {
    console.error('Failed to create draft:', createResult2.error)
  }

  // -------------------------------------------------------------------------
  // Find Many - Get all posts
  // -------------------------------------------------------------------------
  console.log('\n--- Find Many (All Posts) ---')

  const allPosts = await db.posts.findMany()
  console.log('All posts:', allPosts)

  // -------------------------------------------------------------------------
  // Find Many with filtering - Get published posts only
  // -------------------------------------------------------------------------
  console.log('\n--- Find Many (Published Posts) ---')

  const publishedPosts = await db.posts.findMany({
    where: where<PostEntity>((p) => [eq(p.published, true)]),
  })
  console.log('Published posts:', publishedPosts)

  // -------------------------------------------------------------------------
  // Find Unique - Get a post by ID
  // -------------------------------------------------------------------------
  console.log('\n--- Find Unique ---')

  if (isOk(createResult) && createResult.value.id) {
    const postId = createResult.value.id as string
    const uniquePost = await db.posts.findUnique({ where: { id: postId } })
    console.log('Found by ID:', uniquePost)
  }

  // -------------------------------------------------------------------------
  // Count - Get number of records
  // -------------------------------------------------------------------------
  console.log('\n--- Count ---')

  const totalCount = await db.posts.count()
  console.log('Total posts count:', totalCount)

  // -------------------------------------------------------------------------
  // Update - Modify a post
  // -------------------------------------------------------------------------
  console.log('\n--- Update ---')

  if (isOk(createResult2) && createResult2.value.id) {
    const draftId = createResult2.value.id as string

    // Update using the predicate-based where clause
    const updateResult = await db.posts.update({
      where: where<PostEntity>((p) => [eq(p.id, draftId)]),
      data: {
        title: 'Updated Draft Title',
        published: true,
      },
    })

    if (isOk(updateResult)) {
      console.log('Updated records:', updateResult.value.records)
    } else {
      console.error('Failed to update:', updateResult.error)
    }
  }

  // -------------------------------------------------------------------------
  // Find First - Get the first post
  // -------------------------------------------------------------------------
  console.log('\n--- Find First ---')

  const firstPost = await db.posts.findFirst()
  console.log('First post:', firstPost)

  // -------------------------------------------------------------------------
  // Delete - Remove a post
  // -------------------------------------------------------------------------
  console.log('\n--- Delete ---')

  if (isOk(createResult2) && createResult2.value.id) {
    const draftId = createResult2.value.id as string

    const deleteResult = await db.posts.delete({
      where: where<PostEntity>((p) => [eq(p.id, draftId)]),
    })

    if (isOk(deleteResult)) {
      console.log('Deleted records:', deleteResult.value.records)
    } else {
      console.error('Failed to delete:', deleteResult.error)
    }
  }

  // -------------------------------------------------------------------------
  // Final state - Verify changes
  // -------------------------------------------------------------------------
  console.log('\n--- Final State ---')

  const finalPosts = await db.posts.findMany()
  console.log('Final posts:', finalPosts)

  const finalCount = await db.posts.count()
  console.log('Final count:', finalCount)

  console.log('\n=== Basic Blog Example Complete ===\n')
}

main().catch(console.error)
