/**
 * Basic Blog Example
 *
 * This example demonstrates the complete flow from Collection definition
 * to CRUD operations using the @deessejs/collections library.
 *
 * It shows:
 * - How to define a collection with various field types
 * - How to generate database schemas for PostgreSQL and SQLite
 * - How CRUD operations work (mock/demo, not actually executing)
 */

// =============================================================================
// Step 1: Import from the collections library
// =============================================================================

import { collection, field, f } from '@deessejs/collections'

// Database adapters for schema generation
import { createPostgresSchema } from '@deessejs/collections/adapter/postgresql'
import { createSqliteSchema } from '@deessejs/collections/adapter/sqlite'

// CRUD operations for database manipulation
import { create, findOne, findMany, update, remove } from '@deessejs/collections/adapter/crud'

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
// Step 4: CRUD Operations (Conceptual Examples)
// =============================================================================

// The CRUD functions work with any Drizzle-compatible database connection.
// Below are conceptual examples showing how they would be used.

// -----------------------------------------------------------------------------
// Create (Insert a new post)
// -----------------------------------------------------------------------------

// const db = drizzle(connection, { schema: pgSchema })

// Creating a new post with required fields:
// const newPost = await create(db, pgSchema.posts, {
//   title: 'Hello World',
//   content: 'This is my first blog post!',
//   published: true,
// })

// newPost.id will contain the generated UUID
// newPost.createdAt will contain the timestamp

// -----------------------------------------------------------------------------
// Find One (Get a single post by ID)
// -----------------------------------------------------------------------------

// Find a post by its ID:
// const post = await findOne(db, pgSchema.posts, {
//   where: eq(pgSchema.posts.id, 'some-uuid'),
// })

// post?.title // 'Hello World'
// post?.published // true

// -----------------------------------------------------------------------------
// Find Many (Get multiple posts with filtering and pagination)
// -----------------------------------------------------------------------------

// Find all published posts, ordered by creation date:
// const publishedPosts = await findMany(db, pgSchema.posts, {
//   where: eq(pgSchema.posts.published, true),
//   orderBy: desc(pgSchema.posts.createdAt),
//   limit: 10,
//   offset: 0,
// })

// -----------------------------------------------------------------------------
// Update (Modify an existing post)
// -----------------------------------------------------------------------------

// Update a post's title and published status:
// const updatedPost = await update(db, pgSchema.posts, {
//   where: eq(pgSchema.posts.id, 'some-uuid'),
//   data: {
//     title: 'Updated Title',
//     published: false,
//   },
// })

// -----------------------------------------------------------------------------
// Remove (Delete a post)
// -----------------------------------------------------------------------------

// Delete a post by ID:
// await remove(db, pgSchema.posts, {
//   where: eq(pgSchema.posts.id, 'some-uuid'),
// })

// =============================================================================
// Step 5: Console Output (Schema Visualization)
// =============================================================================

// This shows the structure of the generated schemas.
// The actual schema objects contain Drizzle column definitions.

console.log('PostgreSQL schema keys:', Object.keys(pgSchema))
// Output: ['posts']

console.log('SQLite schema keys:', Object.keys(sqliteSchema))
// Output: ['posts']

// Each schema entry (e.g., pgSchema.posts) is a Drizzle table definition
// with columns for: id (UUID primary key), title, content, published,
// createdAt, updatedAt, and other system fields.

// Note: Drizzle tables don't expose columns as a simple object.
// To see the schema structure, use drizzle-inspector or check migration files.

// PostgreSQL posts table uses:
// - uuid() for id with defaultRandom()
// - varchar() for title, content
// - boolean() for published
// - timestamp() for createdAt, updatedAt

console.log('\nPostgreSQL posts table structure:')
console.log('  id: uuid (primary key, auto-generated UUID)')
console.log('  title: varchar (required)')
console.log('  content: text (optional)')
console.log('  published: boolean (default: false)')
console.log('  created_at: timestamp (auto-set on create)')
console.log('  updated_at: timestamp (auto-set on create)')

console.log('\nSQLite posts table structure:')
console.log('  id: text (primary key, auto-generated UUID as text)')
console.log('  title: text (required)')
console.log('  content: text (optional)')
console.log('  published: integer 0/1 (default: 0)')
console.log('  created_at: integer (Unix timestamp)')
console.log('  updated_at: integer (Unix timestamp)')

// =============================================================================
// Schema Differences Between PostgreSQL and SQLite
// =============================================================================

// PostgreSQL-specific types:
// - UUID for identifiers (better for distributed systems)
// - TIMESTAMP WITH TIME ZONE for timestamps
// - JSONB for JSON fields (rich indexing support)

// SQLite-specific types:
// - TEXT for identifiers (simpler, but less performant for joins)
// - TEXT for timestamps (ISO 8601 format)
// - TEXT for JSON fields (simpler storage)

// Both schemas provide the same data model - you choose the database
// that fits your infrastructure requirements.

console.log('\nBasic Blog Example Complete!')
console.log('See the comments in this file for detailed CRUD operation examples.')
