/**
 * Blog with Relations Example
 *
 * This example demonstrates how to define foreign key relationships between
 * collections using the relation field type.
 *
 * Key Concepts:
 * - Three collections: authors, posts, comments
 * - Relations are resolved by matching UUID column names to collection slugs
 * - The resolver strips trailing 'Id' or '_id' suffix to find target collection
 * - e.g., 'authorId' column → looks for 'author' collection → FK to authors.id
 *
 * Generated Foreign Keys (PostgreSQL):
 * - posts.author_id REFERENCES authors.id
 * - comments.post_id REFERENCES posts.id
 * - comments.author_id REFERENCES authors.id
 */

import { collection, field, f } from '@deessejs/collections'
import { createPostgresSchema } from '@deessejs/collections/adapter/postgresql'
import { createSqliteSchema } from '@deessejs/collections/adapter/sqlite'
import { create, findMany } from '@deessejs/collections/adapter/crud'
import { eq } from 'drizzle-orm'

// =============================================================================
// STEP 1: Define Collections with Relations
// =============================================================================

/**
 * Authors collection
 * - id: auto-generated UUID (primary key)
 * - name: required text field
 * - email: unique text field
 */
const authors = collection({
  slug: 'authors',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    email: field({ fieldType: f.email(), unique: true }),
  },
})

/**
 * Posts collection
 * - id: auto-generated UUID (primary key)
 * - title: required text field
 * - content: optional rich text field
 * - authorId: relation field pointing to authors (creates FK)
 *
 * FK Resolution: authorId column → resolveRelation('author_id') → 'author'
 * → looks for 'authors' collection (slug) → creates FK posts.author_id → authors.id
 */
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.richtext() }),
    authorId: field({ fieldType: f.relation(), required: true }),
  },
})

/**
 * Comments collection
 * - id: auto-generated UUID (primary key)
 * - content: required text field
 * - postId: relation to posts (creates FK)
 * - authorId: relation to authors (creates FK, optional)
 *
 * FK Resolution:
 * - postId column → resolveRelation('post_id') → 'post' → looks for 'posts' → FK
 * - authorId column → resolveRelation('author_id') → 'author' → looks for 'authors' → FK
 */
const comments = collection({
  slug: 'comments',
  fields: {
    content: field({ fieldType: f.text(), required: true }),
    postId: field({ fieldType: f.relation(), required: true }),
    authorId: field({ fieldType: f.relation() }),
  },
})

// =============================================================================
// STEP 2: Build Schemas for Both Dialects
// =============================================================================

const pgSchema = createPostgresSchema([authors, posts, comments])
const sqliteSchema = createSqliteSchema([authors, posts, comments])

// =============================================================================
// STEP 3: Understanding FK Resolution
// =============================================================================

/**
 * Foreign key resolution works by:
 * 1. Identifying UUID columns that are not primary keys and don't have defaultRandom
 * 2. Converting column name to potential collection slug via resolveRelation:
 *    - 'authorId' → 'author' (removes 'Id' suffix)
 *    - 'author_id' → 'author' (removes '_id' suffix)
 *    - 'author' → 'author' (no suffix, uses as-is)
 * 3. Looking up the collection by slug
 * 4. Creating FK from column → target_collection.id
 *
 * Note: Field naming matters!
 * - 'authorId' or 'author_id' → resolves to 'authors' collection
 * - 'author' alone would look for 'author' collection (doesn't exist)
 */

// =============================================================================
// STEP 4: Console Output - Show Generated Schema Structure
// =============================================================================

console.log('PostgreSQL tables:', Object.keys(pgSchema))
// Output: ['authors', 'posts', 'comments']

console.log('SQLite tables:', Object.keys(sqliteSchema))
// Output: ['authors', 'posts', 'comments']

// =============================================================================
// STEP 5: CRUD Examples (Async - requires database connection)
// =============================================================================

/**
 * Example: Create an author, then a post with author reference
 *
 * ```typescript
 * // Assuming db is a Drizzle database instance connected to PostgreSQL
 * import { pgSchema } from './blog-with-relations'
 *
 * // Create author first
 * const author = await create(db, pgSchema.authors, {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 * })
 *
 * // Create post with author reference (using authorId, not author)
 * const post = await create(db, pgSchema.posts, {
 *   title: 'Hello World',
 *   content: 'This is my first blog post.',
 *   authorId: author.id,  // FK to authors.id
 * })
 *
 * // Create a comment on the post
 * const comment = await create(db, pgSchema.comments, {
 *   content: 'Great post!',
 *   postId: post.id,      // FK to posts.id
 *   authorId: author.id,   // FK to authors.id (optional field)
 * })
 * ```
 */

/**
 * Example: Find all posts by a specific author
 *
 * ```typescript
 * import { pgSchema } from './blog-with-relations'
 *
 * // Find all posts where author_id equals the given author.id
 * const authorPosts = await findMany(db, pgSchema.posts, {
 *   where: eq(pgSchema.posts.authorId, author.id),
 * })
 *
 * console.log(authorPosts)
 * // [
 * //   { id: '...', title: 'Hello World', authorId: '...', ... },
 * //   { id: '...', title: 'Another Post', authorId: '...', ... }
 * // ]
 * ```
 */

/**
 * Example: Find all comments on a specific post
 *
 * ```typescript
 * // Find all comments where post_id equals the given post.id
 * const postComments = await findMany(db, pgSchema.comments, {
 *   where: eq(pgSchema.comments.postId, post.id),
 * })
 *
 * console.log(postComments)
 * // [
 * //   { id: '...', content: 'Great post!', postId: '...', authorId: '...' },
 * //   { id: '...', content: 'Thanks!', postId: '...', authorId: '...' }
 * // ]
 * ```
 */

/**
 * Example: Find all comments by an author
 *
 * ```typescript
 * // Find all comments where author_id equals the given author.id
 * const authorComments = await findMany(db, pgSchema.comments, {
 *   where: eq(pgSchema.comments.authorId, author.id),
 * })
 * ```
 */

// =============================================================================
// STEP 6: Inspect Generated Schema (for debugging)
// =============================================================================

// Uncomment to see the full generated Drizzle schema:
// console.log('PostgreSQL Full Schema:', pgSchema)
// console.log('SQLite Full Schema:', sqliteSchema)

// =============================================================================
// Export for use in other files
// =============================================================================

export { authors, posts, comments, pgSchema, sqliteSchema }