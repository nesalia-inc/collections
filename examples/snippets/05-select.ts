/**
 * @deessejs/collections Snippet 05: Select
 *
 * This example demonstrates how to build type-safe SELECT clauses
 * using the @deessejs/collections query builder.
 *
 * The select() API allows you to specify which fields to return,
 * supporting nested objects and relation traversal.
 *
 * Run with: npx tsx examples/snippets/05-select.ts
 */

import { collection, field, f, select } from '@deessejs/collections'

// =============================================================================
// Collection Setup
// =============================================================================

/**
 * Define collections for our examples
 */
const authors = collection({
  slug: 'authors',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    email: field({ fieldType: f.email() }),
    bio: field({ fieldType: f.text() }),
  },
})

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.text() }),
    status: field({ fieldType: f.select(['draft', 'published', 'archived']), required: true }),
    viewCount: field({ fieldType: f.number() }),
    publishedAt: field({ fieldType: f.timestamp() }),
    authorId: field({ fieldType: f.relation() }),
    category: field({ fieldType: f.text() }),
  },
})

// =============================================================================
// Type Definitions
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AuthorEntity = {
  id: string
  name: string
  email?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PostEntity = {
  id: string
  title: string
  content?: string
  status: 'draft' | 'published' | 'archived'
  viewCount: number
  publishedAt: Date
  authorId: string
  category?: string
}

// =============================================================================
// Basic Select
// =============================================================================

/**
 * select<T>() - Build a SELECT clause
 *
 * Usage: select<YourEntity>()(p => ({ field1: p.field1, field2: p.field2 }))
 *
 * The return object keys become the alias names in the result.
 * The values are path accesses that specify which fields to select.
 */

/**
 * Select only specific fields from a collection
 * Result type: { id: string, title: string }
 */
const selectBasic = select<PostEntity>()((p) => ({
  id: p.id,
  title: p.title,
}))

/**
 * Select with different alias name
 * Result type: { identifier: string, heading: string }
 */
const selectWithAliases = select<PostEntity>()((p) => ({
  identifier: p.id,
  heading: p.title,
}))

// =============================================================================
// Selecting Multiple Fields
// =============================================================================

/**
 * Select multiple fields for a partial view of the entity
 */
const selectPostSummary = select<PostEntity>()((p) => ({
  id: p.id,
  title: p.title,
  status: p.status,
  viewCount: p.viewCount,
  publishedAt: p.publishedAt,
}))

// =============================================================================
// Nested Select (Relation Traversal)
// =============================================================================

/**
 * For relations, you can select fields from related entities
 * using nested object syntax.
 *
 * Note: This requires proper relation definitions in your schema.
 * The driver will handle joining or fetching related data.
 */

/**
 * Select post with author information via relation
 * Note: authorId is a relation field, you would use nested select
 * with proper relation setup in the schema
 * Result type: { id: string, title: string, authorId: string }
 */
// eslint-disable-next-line no-comment
const selectWithRelation = select<PostEntity>()((p) => ({
  id: p.id,
  title: p.title,
  authorId: p.authorId,
}))

/**
 * Select for list view (id, title, status, publishedAt only - no optional fields)
 */
const selectForList = select<PostEntity>()((p) => ({
  id: p.id,
  title: p.title,
  status: p.status,
  publishedAt: p.publishedAt,
}))

/**
 * Select for detail view (all non-optional fields)
 */
const selectForDetail = select<PostEntity>()((p) => ({
  id: p.id,
  title: p.title,
  status: p.status,
  viewCount: p.viewCount,
  publishedAt: p.publishedAt,
  authorId: p.authorId,
}))

// =============================================================================
// Exclude Fields (Select What You Need)
// =============================================================================

/**
 * Since select() is additive, you explicitly choose fields to include.
 * This is different from "exclude" approaches where you specify what to skip.
 *
 * Common partial selection patterns:
 */

// =============================================================================
// Computed/Transformed Selections
// =============================================================================

/**
 * Select supports transformations through field type transforms.
 * For example, email fields automatically lowercase and trim.
 * timestamp fields preserve the Date object.
 */

// The select simply specifies which paths to select.
// Actual data transformation happens at the driver level based on field types.

// =============================================================================
// Using Select with Where and OrderBy
// =============================================================================

/**
 * Select is typically combined with where() and orderBy()
 * for complete query specification.
 */

import { where, eq, orderBy, desc } from '@deessejs/collections'

const completeQuery = {
  select: selectForList,
  where: where((p: any) => [eq(p.status, 'published')]),
  orderBy: orderBy((p: any) => [desc(p.publishedAt)]),
}

// =============================================================================
// Using Select with Pagination
// =============================================================================

/**
 * Select can be used with offset or cursor pagination.
 * The selected fields are included in each page's results.
 */

import { offset, cursor } from '@deessejs/collections'

// Query with pagination
const paginatedQuery = {
  select: selectForList,
  where: where((p: any) => [eq(p.status, 'published')]),
  orderBy: orderBy((p: any) => [desc(p.publishedAt)]),
  pagination: offset(10, 0, true), // 10 items, offset 0, include total
}

// Cursor pagination with select
const cursorPaginatedQuery = {
  select: selectForList,
  where: where((p: any) => [eq(p.status, 'published')]),
  orderBy: orderBy((p: any) => [desc(p.publishedAt), desc(p.id)]),
  pagination: cursor(10, undefined, false), // 10 items, no cursor, no total
}

// =============================================================================
// Type Safety
// =============================================================================

/**
 * The select() API provides compile-time type safety:
 *
 * - Only PathProxy accesses are allowed (p.id, p.title, etc.)
 * - Literal strings like { age: 42 } will cause a TypeScript error
 * - Nested objects must use PathProxy syntax
 *
 * This prevents runtime errors from typos or invalid field references.
 */

// This would cause a TypeScript error (assuming 'notAField' doesn't exist):
// const invalidSelect = select<PostEntity>()((p) => ({
//   id: p.id,
//   notAField: p.notAField, // Error: Property 'notAField' does not exist
// }))

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Select ===')
console.log('')
console.log('Basic select:')
console.log('- Basic:', JSON.stringify(selectBasic.ast, null, 2))
console.log('')
console.log('Partial selection:')
console.log('- List view:', JSON.stringify(selectForList.ast, null, 2))
console.log('- Detail view:', JSON.stringify(selectForDetail.ast, null, 2))
console.log('')
console.log('With relation:')
console.log('- Post with author:', JSON.stringify(selectWithRelation.ast, null, 2))
console.log('')
console.log('Complete query example:')
console.log('- Query:', JSON.stringify({
  select: completeQuery.select.ast,
  where: completeQuery.where.ast,
  orderBy: completeQuery.orderBy.ast,
}, null, 2))
console.log('')
console.log('Select examples complete!')
