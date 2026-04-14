/**
 * @deessejs/collections Snippet 06: Offset Pagination
 *
 * This example demonstrates offset-based pagination using
 * the @deessejs/collections query builder.
 *
 * Offset pagination is simple but becomes slow on large datasets
 * because it needs to count all skipped rows.
 *
 * For large datasets (>100k records), consider cursor pagination instead.
 * See snippet 07 for cursor-based pagination.
 *
 * Run with: npx tsx examples/snippets/06-pagination-offset.ts
 */

import { collection, field, f, where, eq, orderBy, desc, select } from '@deessejs/collections'
import { offset, page, pageToOffset } from '@deessejs/collections'

// =============================================================================
// Collection Setup
// =============================================================================

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    status: field({ fieldType: f.select(['draft', 'published', 'archived']), required: true }),
    viewCount: field({ fieldType: f.number() }),
    publishedAt: field({ fieldType: f.timestamp() }),
    authorId: field({ fieldType: f.uuid() }),
  },
})

// =============================================================================
// Type Definitions
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PostEntity = {
  id: string
  title: string
  status: 'draft' | 'published' | 'archived'
  viewCount: number
  publishedAt: Date
  authorId: string
}

// =============================================================================
// Basic Offset Pagination
// =============================================================================

/**
 * offset(limit, offset, includeTotal?) - Create offset pagination input
 *
 * @param limit - Maximum items per page
 * @param offset - Number of items to skip (offset = (page - 1) * limit)
 * @param includeTotal - Whether to include total count (default: true)
 *
 * Returns an OffsetPaginationInput with _tag: 'OffsetPagination'
 */

/**
 * Get first 10 items (page 1)
 * SQL: LIMIT 10 OFFSET 0
 */
const firstPage = offset(10, 0)

/**
 * Get items 11-20 (page 2)
 * SQL: LIMIT 10 OFFSET 10
 */
const secondPage = offset(10, 10)

/**
 * Get items 21-30 (page 3)
 * SQL: LIMIT 10 OFFSET 20
 */
const thirdPage = offset(10, 20)

/**
 * With total count included (for displaying "Showing 1-10 of 150")
 * includeTotal: true is the default
 */
const firstPageWithTotal = offset(10, 0, true)

/**
 * Without total count (slightly faster, good for "Load More" buttons)
 */
const firstPageWithoutTotal = offset(10, 0, false)

// =============================================================================
// Page-Based Pagination
// =============================================================================

/**
 * page(pageNumber, limit, includeTotal?) - Create offset from page number
 *
 * This is a convenience function that calculates offset from page number.
 * Page numbers are 1-based (page 1 = first page).
 *
 * @param pageNum - 1-based page number
 * @param limit - Maximum items per page
 * @param includeTotal - Whether to include total count (default: true)
 */

/**
 * Page 1 with 10 items per page
 */
const page1 = page(1, 10)

/**
 * Page 5 with 20 items per page
 * offset = (5 - 1) * 20 = 80
 */
const page5 = page(5, 20)

/**
 * Page 1 with 50 items per page, no total (good for infinite scroll)
 */
const page1InfiniteScroll = page(1, 50, false)

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * pageToOffset(page, limit) - Convert page number to offset
 *
 * Useful when you need to calculate the offset manually but still
 * want to use the page() convenience function.
 */
const calculatedOffset = pageToOffset(3, 25) // Returns 50 (3rd page with 25 items)

// =============================================================================
// Building Paginated Queries
// =============================================================================

/**
 * Combine offset pagination with where, orderBy, and select
 * for a complete paginated query.
 */

// Define the fields to select
const selectPostSummary = select<PostEntity>()((p) => ({
  id: p.id,
  title: p.title,
  status: p.status,
  viewCount: p.viewCount,
  publishedAt: p.publishedAt,
}))

// Define the ordering
const orderByNewest = orderBy((p: any) => [
  desc(p.publishedAt),
])

// Define the filter
const publishedOnly = where((p: any) => [
  eq(p.status, 'published'),
])

/**
 * Example: Get page 2 of published posts, 10 items per page
 */
const paginatedQuery = {
  select: selectPostSummary,
  where: publishedOnly,
  orderBy: orderByNewest,
  pagination: offset(10, 10, true), // 10 items, skip 10, include total
}

/**
 * Example: Infinite scroll style - page 3, 20 items per page, no total
 */
const infiniteScrollQuery = {
  select: selectPostSummary,
  where: publishedOnly,
  orderBy: orderByNewest,
  pagination: page(3, 20, false),
}

// =============================================================================
// Paginated Response Type
// =============================================================================

/**
 * The result of a paginated query has this structure:
 *
 * interface Paginated<T> {
 *   current: {
 *     data: T[]           // Array of items in current page
 *     total: number | null // Total count (or null if not requested)
 *     limit: number        // Max items per page
 *     offset: number        // Number of items skipped
 *   }
 *   hasNext: boolean        // Whether there is a next page
 *   hasPrevious: boolean    // Whether there is a previous page
 *   next(): Promise<Paginated<T> | null>  // Navigate to next page
 *   previous(): Promise<Paginated<T> | null> // Navigate to previous page
 * }
 *
 * Note: Paginated<T> contains methods (next/previous) and is NOT
 * JSON-serializable. For API responses, extract data via current.data
 * and compute pagination metadata manually.
 */

/**
 * Example of processing paginated results (pseudo-code):
 *
 * async function fetchPosts(pageNum: number) {
 *   const result = await db.findPaginated({
 *     select: selectPostSummary,
 *     where: publishedOnly,
 *     orderBy: orderByNewest,
 *     pagination: page(pageNum, 10),
 *   })
 *
 *   // For JSON API responses:
 *   return {
 *     items: result.current.data,
 *     page: pageNum,
 *     limit: result.current.limit,
 *     total: result.current.total,
 *     hasNext: result.hasNext,
 *     hasPrevious: result.hasPrevious,
 *   }
 * }
 */

// =============================================================================
// Common Pagination Patterns
// =============================================================================

/**
 * Standard paginated list with page numbers
 */
interface PaginatedListOptions {
  pageNum: number
  limit: number
  includeTotal?: boolean
}

function buildPaginatedListQuery(options: PaginatedListOptions) {
  const { pageNum, limit, includeTotal = true } = options

  return {
    select: selectPostSummary,
    where: publishedOnly,
    orderBy: orderByNewest,
    pagination: page(pageNum, limit, includeTotal),
  }
}

/**
 * Infinite scroll / Load more pattern
 */
function buildInfiniteScrollQuery(pageNum: number, limit: number = 10) {
  return {
    select: selectPostSummary,
    where: publishedOnly,
    orderBy: orderByNewest,
    pagination: page(pageNum, limit, false), // No total for infinite scroll
  }
}

/**
 * Simple offset-based query for small datasets (<10k records)
 */
function buildSimpleQuery(limit: number, offsetValue: number) {
  return {
    select: selectPostSummary,
    where: publishedOnly,
    orderBy: orderByNewest,
    pagination: offset(limit, offsetValue, true),
  }
}

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Offset Pagination ===')
console.log('')
console.log('Offset pagination:')
console.log('- First page (10 items):', JSON.stringify(firstPage, null, 2))
console.log('- Second page (10 items):', JSON.stringify(secondPage, null, 2))
console.log('- Page 5 (20 items):', JSON.stringify(page5, null, 2))
console.log('')
console.log('Pagination helper:')
console.log('- pageToOffset(3, 25):', calculatedOffset)
console.log('')
console.log('Complete query:')
console.log('- Paginated query:', JSON.stringify({
  select: paginatedQuery.select.ast,
  where: paginatedQuery.where.ast,
  orderBy: paginatedQuery.orderBy.ast,
  pagination: paginatedQuery.pagination,
}, null, 2))
console.log('')
console.log('Offset pagination examples complete!')
