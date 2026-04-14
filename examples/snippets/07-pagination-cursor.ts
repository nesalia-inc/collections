/**
 * @deessejs/collections Snippet 07: Cursor Pagination
 *
 * This example demonstrates cursor-based pagination using
 * the @deessejs/collections query builder.
 *
 * Cursor pagination is more performant than offset pagination for
 * large datasets because it doesn't need to count skipped rows.
 * Instead, it uses values from the last row to establish position.
 *
 * Run with: npx tsx examples/snippets/07-pagination-cursor.ts
 */

import { collection, field, f, where, eq, orderBy, desc, select } from '@deessejs/collections'
import { cursor, cursorWithValue, encodeCursor, decodeCursor } from '@deessejs/collections'

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
    priority: field({ fieldType: f.number() }),
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
  priority: number
}

// =============================================================================
// Basic Cursor Pagination
// =============================================================================

/**
 * cursor(limit, cursor?, includeTotal?) - Create cursor pagination input
 *
 * @param limit - Maximum items per page
 * @param cursor - Optional cursor string (base64 encoded)
 * @param includeTotal - Whether to include total count (default: false)
 *
 * Returns a CursorPaginationInput with _tag: 'CursorPagination'
 *
 * IMPORTANT: Cursor pagination REQUIRES an orderBy clause.
 * The cursor encodes the values of all orderBy fields to ensure
 * consistent pagination through sorted results.
 */

/**
 * First page of results (no cursor)
 * The cursor is undefined/empty for the first page.
 */
const firstCursorPage = cursor(10, undefined, false)

/**
 * First page with total count
 * includeTotal: false is the default for performance.
 * Only set to true if you need to show "X items total".
 */
const firstCursorPageWithTotal = cursor(10, undefined, true)

/**
 * Subsequent page with cursor from previous results
 * The cursor string is obtained from the previous page's last item.
 */
const subsequentCursorPage = cursor(10, 'eyJ2YWx1ZXMiOnsicHVibGlzaGVkQXQiOiIyMDI0LTAxLTE1VDAzOjQ1OjI5WiIsImlkIjoiYWJjLTEyMyJ9LCJvcmRlckJZIjpbInB1Ymxpc2hlZEF0IiwiaWQiXX0=', false)

// =============================================================================
// Cursor with Manual Value
// =============================================================================

/**
 * cursorWithValue(limit, values, orderByFields, includeTotal?)
 *
 * Create a cursor pagination input with manually specified values.
 * Useful when you have a specific item to start from.
 *
 * @param limit - Maximum items per page
 * @param values - Record of field values to encode in cursor
 * @param orderByFields - Array of field names matching the orderBy clause
 * @param includeTotal - Whether to include total count
 */

/**
 * Start from a specific record's position
 */
const cursorFromValue = cursorWithValue(
  10,
  { publishedAt: new Date('2024-01-15T03:45:29Z'), id: 'abc-123' },
  ['publishedAt', 'id']
)

// =============================================================================
// Manual Cursor Encoding/Decoding
// =============================================================================

/**
 * encodeCursor(value) - Encode a cursor value to string
 * decodeCursor(encoded) - Decode a cursor string back to value
 *
 * Use these when you need to:
 * - Extract cursor from external source
 * - Build cursor from values you have
 * - Debug cursor encoding issues
 */

/**
 * Encode a cursor manually
 */
const manualCursor = encodeCursor({
  values: { publishedAt: new Date('2024-01-15T03:45:29Z'), id: 'abc-123' },
  orderBy: ['publishedAt', 'id'],
})

/**
 * Decode a cursor
 */
const decodedCursor = decodeCursor(manualCursor)

if (decodedCursor) {
  console.log('Decoded cursor values:', decodedCursor.values)
  console.log('Decoded cursor orderBy:', decodedCursor.orderBy)
}

// =============================================================================
// Building Cursor Paginated Queries
// =============================================================================

/**
 * Cursor pagination REQUIRES orderBy.
 * The orderBy fields are encoded in the cursor to ensure
 * consistent ordering across pages.
 *
 * IMPORTANT: The orderBy fields should uniquely identify each record.
 * Add a unique field (like id) as a tiebreaker if needed.
 */

// Define the fields to select
const selectPostSummary = select<PostEntity>()((p) => ({
  id: p.id,
  title: p.title,
  status: p.status,
  viewCount: p.viewCount,
  publishedAt: p.publishedAt,
  priority: p.priority,
}))

// Define the ordering - MUST be unique fields to ensure cursor works correctly
const orderByForCursor = orderBy((p: any) => [
  desc(p.publishedAt),  // Primary sort - newest first
  desc(p.id),        // Tiebreaker - ensures uniqueness
])

// Define the filter
const publishedOnly = where((p: any) => [
  eq(p.status, 'published'),
])

/**
 * Example: First page of published posts
 */
const cursorQueryFirstPage = {
  select: selectPostSummary,
  where: publishedOnly,
  orderBy: orderByForCursor,
  pagination: cursor(10, undefined, false),
}

/**
 * Example: Next page with cursor from previous result
 */
const cursorQueryNextPage = {
  select: selectPostSummary,
  where: publishedOnly,
  orderBy: orderByForCursor,
  pagination: cursor(10, manualCursor, false),
}

// =============================================================================
// Cursor Pagination vs Offset Pagination
// =============================================================================

/**
 * When to use cursor vs offset pagination:
 *
 * OFFSET PAGINATION (use when):
 * - Dataset is small (<10,000 records)
 * - Users need to jump to specific pages
 * - Page numbers are displayed in UI
 * - Sorting is simple (single field)
 *
 * CURSOR PAGINATION (use when):
 * - Dataset is large (>10,000 records)
 * - Performance is critical
 * - Infinite scroll or "Load More" UI
 * - Sorting by multiple fields
 * - Data changes frequently during pagination
 */

// =============================================================================
// Working with Cursor Results
// =============================================================================

/**
 * Example: Processing cursor paginated results (pseudo-code)
 *
 * interface CursorPage {
 *   current: {
 *     data: PostSummary[]
 *     total: number | null
 *     limit: number
 *     offset: number
 *   }
 *   hasNext: boolean
 *   hasPrevious: boolean
 *   next(): Promise<CursorPage | null>
 *   previous(): Promise<CursorPage | null>
 * }
 *
 * // First page
 * const firstPage = await db.findPaginated(cursorQueryFirstPage)
 *
 * // Check if there are more results
 * if (firstPage.hasNext) {
 *   // Get next page
 *   const nextPage = await firstPage.next()
 *
 *   // Extract cursor from last item for external storage
 *   if (nextPage.current.data.length > 0) {
 *     const lastItem = nextPage.current.data[nextPage.current.data.length - 1]
 *     const nextCursor = encodeCursor({
 *       values: { publishedAt: lastItem.publishedAt, id: lastItem.id },
 *       orderBy: ['publishedAt', 'id'],
 *     })
 *   }
 * }
 */

// =============================================================================
// Common Cursor Pagination Patterns
// =============================================================================

/**
 * API endpoint pattern for cursor pagination
 */
interface CursorPaginationParams {
  limit?: number
  cursor?: string
}

function buildCursorQuery(params: CursorPaginationParams) {
  const limit = params.limit ?? 10

  return {
    select: selectPostSummary,
    where: publishedOnly,
    orderBy: orderByForCursor,
    pagination: cursor(limit, params.cursor, false),
  }
}

/**
 * Extract cursor from last item of results
 */
function extractCursorFromItem(item: { publishedAt: Date; id: string }): string {
  return encodeCursor({
    values: { publishedAt: item.publishedAt, id: item.id },
    orderBy: ['publishedAt', 'id'],
  })
}

/**
 * Handle "Load More" button click
 */
async function loadMore(currentCursor?: string) {
  const query = buildCursorQuery({ limit: 10, cursor: currentCursor })
  // Note: db.findPaginated is pseudo-code - actual implementation depends on driver
  // const result = await db.findPaginated(query)

  // Example response structure:
  return {
    items: [] as any,
    nextCursor: null as string | null,
    hasMore: false,
  }
}

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Cursor Pagination ===')
console.log('')
console.log('Basic cursor pagination:')
console.log('- First page:', JSON.stringify(firstCursorPage, null, 2))
console.log('- With total:', JSON.stringify(firstCursorPageWithTotal, null, 2))
console.log('')
console.log('Cursor encoding:')
console.log('- Encoded cursor:', manualCursor)
console.log('- Decoded cursor:', decodedCursor)
console.log('')
console.log('Cursor from value:')
console.log('- Query:', JSON.stringify({
  select: cursorQueryFirstPage.select.ast,
  where: cursorQueryFirstPage.where.ast,
  orderBy: cursorQueryFirstPage.orderBy.ast,
  pagination: cursorQueryFirstPage.pagination,
}, null, 2))
console.log('')
console.log('Cursor pagination examples complete!')
