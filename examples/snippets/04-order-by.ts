/**
 * @deessejs/collections Snippet 04: Order By
 *
 * This example demonstrates how to build type-safe ORDER BY clauses
 * using the @deessejs/collections query builder.
 *
 * Run with: npx tsx examples/snippets/04-order-by.ts
 */

import { collection, field, f, orderBy, asc, desc } from '@deessejs/collections'

// =============================================================================
// Collection Setup
// =============================================================================

/**
 * Define a collection for our examples
 * Note: createdAt, updatedAt, id are auto-generated - don't use these names
 */
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    status: field({ fieldType: f.select(['draft', 'published', 'archived']), required: true }),
    viewCount: field({ fieldType: f.number() }),
    publishedAt: field({ fieldType: f.timestamp() }),
    authorId: field({ fieldType: f.uuid() }),
    priority: field({ fieldType: f.number() }),
    slug: field({ fieldType: f.text() }),
  },
})

// =============================================================================
// Type Definitions
// =============================================================================

// Type representing the Post entity (inferred from collection)
type PostEntity = {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  viewCount: number
  publishedAt?: Date
  authorId: string
  priority: number
  slug: string
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// Basic Order By
// =============================================================================

/**
 * orderBy(builder) - Build an ORDER BY clause
 *
 * The builder receives a PathProxy and returns asc() or desc() calls.
 * - asc(p.field) - Order by field ascending (A-Z, 0-9, oldest first)
 * - desc(p.field) - Order by field descending (Z-A, 9-0, newest first)
 *
 * You can return a single OrderNode or an array of OrderNodes.
 */

/**
 * Order by a single field ascending
 * Example: ORDER BY published_at ASC
 */
const orderByPublishedAtAsc = orderBy<{ publishedAt: Date }>((p) => [
  asc(p.publishedAt),
])

/**
 * Order by a single field descending
 * Example: ORDER BY published_at DESC
 */
const orderByPublishedAtDesc = orderBy<{ publishedAt: Date }>((p) => [
  desc(p.publishedAt),
])

// =============================================================================
// Multiple Sort Fields
// =============================================================================

/**
 * Order by multiple fields - useful for tie-breaking
 * The first field has highest priority, second is used for ties, etc.
 *
 * Example: ORDER BY priority DESC, published_at ASC
 * First sorts by priority (high to low), then by date for same priority
 */
const orderByPriorityAndDate = orderBy<{ priority: number; publishedAt: Date }>((p) => [
  desc(p.priority),
  asc(p.publishedAt),
])

/**
 * Complex ordering: status first, then by date
 */
const orderByStatusAndDate = orderBy<{ status: string; publishedAt: Date }>((p) => [
  asc(p.status),
  desc(p.publishedAt),
])

// =============================================================================
// Common Order Patterns
// =============================================================================

/**
 * Newest first - most common pattern for feeds and timelines
 * ORDER BY published_at DESC
 */
const newestFirst = orderBy<{ publishedAt: Date }>((p) => [
  desc(p.publishedAt),
])

/**
 * Oldest first - useful for audit logs, activity feeds
 * ORDER BY published_at ASC
 */
const oldestFirst = orderBy<{ publishedAt: Date }>((p) => [
  asc(p.publishedAt),
])

/**
 * Most popular - order by view count descending
 * ORDER BY view_count DESC
 */
const mostPopular = orderBy<{ viewCount: number }>((p) => [
  desc(p.viewCount),
])

/**
 * Alphabetical - order by title A-Z
 * ORDER BY title ASC
 */
const alphabetical = orderBy<{ title: string }>((p) => [
  asc(p.title),
])

/**
 * Reverse alphabetical - order by title Z-A
 * ORDER BY title DESC
 */
const reverseAlphabetical = orderBy<{ title: string }>((p) => [
  desc(p.title),
])

// =============================================================================
// Using with Pagination
// =============================================================================

/**
 * Order by is essential for cursor-based pagination.
 * The cursor encodes the values of all orderBy fields to ensure
 * consistent pagination through sorted results.
 *
 * For cursor pagination, the orderBy fields MUST uniquely identify
 * each record. Consider adding a unique field (like id) as a tiebreaker
 * if your business fields don't guarantee uniqueness.
 */

/**
 * Safe for cursor pagination - includes unique id as tiebreaker
 * ORDER BY priority DESC, published_at DESC, id DESC
 */
const safeForCursorPagination = orderBy<{ priority: number; publishedAt: Date; id: string }>((p) => [
  desc(p.priority),
  desc(p.publishedAt),
  desc(p.id),
])

// =============================================================================
// Using Order By in Queries
// =============================================================================

/**
 * Order by clauses are used with database operations:
 * - db.findMany({ orderBy: orderBy(...) })
 * - db.findPaginated({ orderBy: orderBy(...), pagination: ... })
 *
 * The exact API depends on your database driver integration.
 */

interface QueryOptions {
  orderBy: ReturnType<typeof newestFirst>
  limit?: number
  offset?: number
}

// Query with ordering
const queryOptions: QueryOptions = {
  orderBy: newestFirst,
  limit: 20,
  offset: 0,
}

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Order By ===')
console.log('')
console.log('Basic ordering:')
console.log('- Newest first:', JSON.stringify(newestFirst.ast, null, 2))
console.log('- Oldest first:', JSON.stringify(oldestFirst.ast, null, 2))
console.log('')
console.log('Multiple fields:')
console.log('- Priority and date:', JSON.stringify(orderByPriorityAndDate.ast, null, 2))
console.log('- Status and date:', JSON.stringify(orderByStatusAndDate.ast, null, 2))
console.log('')
console.log('Common patterns:')
console.log('- Most popular:', JSON.stringify(mostPopular.ast, null, 2))
console.log('- Alphabetical:', JSON.stringify(alphabetical.ast, null, 2))
console.log('')
console.log('Safe for cursor:')
console.log('- With unique tiebreaker:', JSON.stringify(safeForCursorPagination.ast, null, 2))
console.log('')
console.log('Order by examples complete!')
