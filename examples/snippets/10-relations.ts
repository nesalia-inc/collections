/**
 * @deessejs/collections Snippet 10: Relations
 *
 * This example demonstrates how to define and work with
 * relations between collections in @deessejs/collections.
 *
 * Relations allow you to model:
 * - One-to-One: User has one Profile
 * - One-to-Many: Author has many Posts
 * - Many-to-One: Post belongs to one Author
 * - Many-to-Many: Post has many Tags, Tag has many Posts
 *
 * Run with: npx tsx examples/snippets/10-relations.ts
 */

import { collection, field, f, where, eq, select } from '@deessejs/collections'
import { orderBy, asc, desc } from '@deessejs/collections'

// =============================================================================
// Relation Types Overview
// =============================================================================

/**
 * In @deessejs/collections, relations are defined at the field level using
 * f.relation() which creates a UUID field that references another collection.
 *
 * The semantics of the relation (one-to-one, one-to-many, many-to-many)
 * are determined by how you structure your collections:
 *
 * - One-to-One: Both sides have a single relation field pointing to each other
 * - One-to-Many: One side has a single relation, the other has array of relations
 * - Many-to-Many: Requires a junction/joint table with two relation fields
 */

// =============================================================================
// Example: Author -> Posts (One-to-Many)
// =============================================================================

/**
 * Authors can have many posts, but each post has exactly one author.
 * We model this by adding a relation field to the Post pointing to Author.
 */

/**
 * Authors collection
 */
const authors = collection({
  slug: 'authors',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    email: field({ fieldType: f.email(), unique: true }),
    bio: field({ fieldType: f.text() }),
    avatar: field({ fieldType: f.url() }),
  },
})

/**
 * Posts collection with author relation
 * The authorId field stores the UUID of the related Author
 */
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.text() }),
    status: field({
      fieldType: f.select(['draft', 'published', 'archived']),
      required: true,
      defaultValue: 'draft' as const,
    }),
    authorId: field({
      fieldType: f.relation(), // References authors.id
      required: true,
    }),
    featuredImage: field({ fieldType: f.url() }),
    viewCount: field({ fieldType: f.number(), defaultValue: 0 }),
  },
})

// =============================================================================
// Example: Category -> Posts (Many-to-One)
// =============================================================================

/**
 * Categories can have many posts, but each post has exactly one category.
 * This is another form of one-to-many from the category perspective.
 */

const categories = collection({
  slug: 'categories',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    slug: field({ fieldType: f.text(), required: true, unique: true }),
    description: field({ fieldType: f.text() }),
    parentId: field({ fieldType: f.relation() }), // For hierarchical categories
  },
})

// Add category relation to posts
const postsWithCategory = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.text() }),
    status: field({
      fieldType: f.select(['draft', 'published', 'archived']),
      required: true,
      defaultValue: 'draft' as const,
    }),
    authorId: field({
      fieldType: f.relation(),
      required: true,
    }),
    categoryId: field({
      fieldType: f.relation(), // References categories.id
    }),
  },
})

// =============================================================================
// Example: Posts <-> Tags (Many-to-Many)
// =============================================================================

/**
 * Many-to-many relations require a junction table.
 * A post can have many tags, and a tag can have many posts.
 *
 * We model this with a junction table `post-tags` that has
 * two relation fields: one to posts, one to tags.
 */

const tags = collection({
  slug: 'tags',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    slug: field({ fieldType: f.text(), required: true, unique: true }),
    color: field({ fieldType: f.text() }),
  },
})

/**
 * Junction table for Posts <-> Tags
 * This is an implementation detail that would typically be managed
 * by the database driver or framework.
 */
const postTags = collection({
  slug: 'post-tags',
  fields: {
    postId: field({
      fieldType: f.relation(),
      required: true,
    }),
    tagId: field({
      fieldType: f.relation(),
      required: true,
    }),
  },
})

// =============================================================================
// Example: User -> Profile (One-to-One)
// =============================================================================

/**
 * Each user has exactly one profile, and each profile belongs to one user.
 * We model this with relation fields on both sides.
 */

const users = collection({
  slug: 'users',
  fields: {
    email: field({ fieldType: f.email(), required: true, unique: true }),
    username: field({ fieldType: f.text(), required: true, unique: true }),
    profileId: field({
      fieldType: f.relation(), // Points to user's profile
      unique: true, // Ensures one-to-one relationship
    }),
  },
})

const profiles = collection({
  slug: 'profiles',
  fields: {
    userId: field({
      fieldType: f.relation(),
      required: true,
      unique: true, // Ensures one-to-one relationship
    }),
    firstName: field({ fieldType: f.text() }),
    lastName: field({ fieldType: f.text() }),
    avatar: field({ fieldType: f.url() }),
    bio: field({ fieldType: f.text() }),
    location: field({ fieldType: f.text() }),
    website: field({ fieldType: f.url() }),
  },
})

// =============================================================================
// Example: Comments (Self-Referential / Hierarchical)
// =============================================================================

/**
 * Comments can have replies (nested comments).
 * This is a self-referential one-to-many relation.
 */

const comments = collection({
  slug: 'comments',
  fields: {
    postId: field({
      fieldType: f.relation(),
      required: true,
    }),
    parentId: field({
      fieldType: f.relation(), // References comments.id (self-reference)
    }),
    authorId: field({
      fieldType: f.relation(),
      required: true,
    }),
    content: field({
      fieldType: f.text(),
      required: true,
    }),
    isDeleted: field({
      fieldType: f.boolean(),
      defaultValue: false,
    }),
  },
})

// =============================================================================
// Working with Relations (Query Examples)
// =============================================================================

/**
 * These examples show how relations are used in queries.
 * The exact API depends on your database driver integration.
 */

// Define entity types for type safety
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AuthorEntity = {
  id: string
  name: string
  email?: string
  bio?: string
  avatar?: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PostEntity = {
  id: string
  title: string
  content?: string
  status: 'draft' | 'published' | 'archived'
  authorId: string
  categoryId?: string
  featuredImage?: string
  viewCount: number
}

/**
 * Example 1: Get posts by a specific author
 */
const postsByAuthor = where<PostEntity>((p) => [
  eq(p.authorId, 'author-uuid-here'),
])

/**
 * Example 2: Get posts with selected author information
 * Using nested select to include author data
 */
const postsWithAuthorSelect = select<PostEntity>()((p) => ({
  id: p.id,
  title: p.title,
  status: p.status,
  viewCount: p.viewCount,
  author: {
    id: p.author.id,
    name: p.author.name,
    avatar: p.author.avatar,
  },
}))

/**
 * Example 3: Order posts by author's name (via relation)
 * Note: This requires the database to support JOINs or nested queries
 */
const postsOrderedByAuthorName = orderBy<PostEntity>((p) => [
  asc(p.author.name),
  desc(p.createdAt),
])

/**
 * Example 4: Get comments with their replies (hierarchical query)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type CommentEntity = {
  id: string
  postId: string
  parentId?: string
  authorId: string
  content: string
  isDeleted: boolean
}

const topLevelComments = where<CommentEntity>((c) => [
  eq(c.postId, 'post-uuid-here'),
  // Would need to add isNull check for parentId
  // isNull(c.parentId),
])

const repliesToComment = where<CommentEntity>((c) => [
  eq(c.parentId, 'comment-uuid-here'),
])

// =============================================================================
// Relation Field Options
// =============================================================================

/**
 * Relation fields can have these options:
 * - required: Whether the relation must exist (default: false)
 * - unique: Ensures one-to-one when true (default: false)
 * - indexed: Creates an index for faster lookups (default: false)
 */

const requiredRelation = field({
  fieldType: f.relation(),
  required: true, // Must have a value
})

const uniqueRelation = field({
  fieldType: f.relation(),
  unique: true, // Only one record can reference a given target
})

const indexedRelation = field({
  fieldType: f.relation(),
  indexed: true, // Creates database index for faster queries
})

// =============================================================================
// Building a Complete Schema with Relations
// =============================================================================

import { defineConfig } from '@deessejs/collections'

/**
 * Complete blog schema with relations
 */
const blogSchema = defineConfig({
  collections: [
    authors,
    categories,
    postsWithCategory,
    tags,
    postTags,
    comments,
  ],
})

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Relations ===')
console.log('')
console.log('Relation examples:')
console.log('')
console.log('1. Author -> Posts (One-to-Many):')
console.log('   authors has many posts via authorId in posts')
console.log('')
console.log('2. Category -> Posts (Many-to-One):')
console.log('   categories has many posts via categoryId in posts')
console.log('')
console.log('3. Posts <-> Tags (Many-to-Many):')
console.log('   Requires junction table: post-tags')
console.log('')
console.log('4. User <-> Profile (One-to-One):')
console.log('   users.profileId -> profiles.id (unique on both sides)')
console.log('   profiles.userId -> users.id (unique on both sides)')
console.log('')
console.log('5. Comments (Self-Referential):')
console.log('   comments.parentId -> comments.id')
console.log('')
console.log('Schema collections:')
console.log(blogSchema.collections)
console.log('')
console.log('Relations examples complete!')
