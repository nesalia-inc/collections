/**
 * Offset-Based Pagination Example
 *
 * This example demonstrates how to use offset-based pagination with findMany.
 * Offset pagination is simple but less performant on large datasets because
 * it uses LIMIT/OFFSET which require scanning all prior rows.
 *
 * Use offset pagination when:
 * - You need random access to pages (jumping to page 5 directly)
 * - The dataset is small to medium sized
 * - You don't have many concurrent users
 */

import { collection, field, f, offset, page, pageToOffset } from '@deessejs/collections'
import type { Paginated } from '@deessejs/collections'

// ============================================================================
// 1. Define a Collection
// ============================================================================

/**
 * Blog posts collection with various field types
 * Each post has a title, content, publication status, author, and view count
 */
const posts = collection({
  slug: 'posts',
  name: 'Blog Posts',
  fields: {
    title: field({
      fieldType: f.text({ maxLength: 200 }),
      required: true,
    }),
    content: field({
      fieldType: f.richtext(),
      required: true,
    }),
    published: field({
      fieldType: f.boolean(),
      defaultFactory: () => false,
    }),
    author: field({
      fieldType: f.text({ maxLength: 100 }),
      required: true,
    }),
    viewCount: field({
      fieldType: f.number(),
      defaultFactory: () => 0,
    }),
    category: field({
      fieldType: f.select(['tech', 'lifestyle', 'business', 'other'] as const),
    }),
  },
})

// ============================================================================
// 2. Create Pagination Input
// ============================================================================

/**
 * Method A: Using offset() directly
 * - limit: Maximum items per page
 * - offset: Number of items to skip
 * - includeTotal: Whether to calculate total count (default: true)
 *
 * offset = (pageNumber - 1) * limit
 * To get page 3 with 10 items per page: offset = (3-1) * 10 = 20
 */
const paginationInput = offset(10, 20, true)

/**
 * Method B: Using page() helper
 * page() automatically calculates the offset from a 1-based page number
 * page(pageNumber, limit, includeTotal)
 *
 * This is equivalent to page 3 with 10 items per page
 */
const paginationInputFromPage = page(3, 10, true)

/**
 * Method C: Manual offset calculation
 * Useful when you already know the offset
 */
const pageNumber = 5
const itemsPerPage = 15
const manualOffset = pageToOffset(pageNumber, itemsPerPage) // (5-1) * 15 = 60
const manualPagination = offset(itemsPerPage, manualOffset)

// ============================================================================
// 3. Using Paginated Results
// ============================================================================

/**
 * Example: Fetching paginated results
 * Note: Paginated<T> is NOT JSON-serializable. Extract data for API responses.
 */
async function fetchBlogPosts() {
  // Assume db is your Drizzle database instance
  // const db = drizzle(connectionString)
  // const postsCollection = createCollection(db, posts)

  // Example pagination input (page 1, 10 items)
  const pagination = page(1, 10)

  // Simulated fetch - in real usage:
  // const result: Paginated<Post> = await postsCollection.findMany({
  //   where: { published: true },
  //   orderBy: ['createdAt'],
  //   pagination,
  // })

  // Simulated result for demonstration
  const result: Paginated<Post> = {
    current: {
      data: [],
      total: 150,
      limit: 10,
      offset: 0,
    },
    hasNext: true,
    hasPrevious: false,
    next: async () => null,
    previous: async () => null,
  }

  // ============================================================================
  // Accessing Paginated Result Properties
  // ============================================================================

  // Current page data - array of items
  const items = result.current.data
  console.log(`Found ${items.length} posts on this page`)

  // Total count across all pages (null if includeTotal was false)
  const total = result.current.total
  if (total !== null) {
    const totalPages = Math.ceil(total / result.current.limit)
    console.log(`Page 1 of ${totalPages} (${total} total posts)`)
  }

  // Limit and offset info
  console.log(`Showing ${result.current.limit} items per page`)
  console.log(`Skipped ${result.current.offset} items`)

  // Navigation helpers
  console.log(`Has next page: ${result.hasNext}`)
  console.log(`Has previous page: ${result.hasPrevious}`)

  // ============================================================================
  // Navigation Example
  // ============================================================================

  // Navigate to next page
  if (result.hasNext) {
    const nextPage: Paginated<Post> | null = await result.next()
    if (nextPage) {
      console.log(`Now on page with ${nextPage.current.data.length} items`)
      console.log(`Has next: ${nextPage.hasNext}, Has previous: ${nextPage.hasPrevious}`)
    }
  }

  // Navigate to previous page
  if (result.hasPrevious) {
    const prevPage: Paginated<Post> | null = await result.previous()
    if (prevPage) {
      console.log(`Back to page with ${prevPage.current.data.length} items`)
    }
  }

  // ============================================================================
  // Extracting Data for JSON API Response
  // ============================================================================

  /**
   * IMPORTANT: Paginated<T> contains methods and cannot be serialized directly.
   * For REST/API responses, extract the data and compute pagination manually.
   */
  const apiResponse = {
    items: result.current.data,
    pagination: {
      page: Math.floor(result.current.offset / result.current.limit) + 1,
      pageSize: result.current.limit,
      total: result.current.total,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious,
    },
  }

  console.log('API Response:', JSON.stringify(apiResponse, null, 2))
}

// ============================================================================
// 4. Pagination with Filtering and Ordering
// ============================================================================

/**
 * Example: Complex query with pagination
 */
async function fetchFilteredPosts() {
  // const db = drizzle(connectionString)
  // const postsCollection = createCollection(db, posts)

  // Pagination with 10 items, skip 20 (page 3)
  const pagination = offset(10, 20, true)

  // const result = await postsCollection.findMany({
  //   where: {
  //     published: true,
  //     category: 'tech',
  //   },
  //   orderBy: ['viewCount', 'createdAt'],
  //   pagination,
  // })

  console.log('Filtered and paginated query example constructed')
}

// ============================================================================
// 5. Helper Functions
// ============================================================================

/**
 * Create pagination for a specific page number
 */
function getPaginationForPage(
  pageNum: number,
  itemsPerPage: number = 10,
  includeTotal: boolean = true
) {
  return page(pageNum, itemsPerPage, includeTotal)
}

/**
 * Calculate offset from page number
 * offset = (page - 1) * limit
 */
function calculateOffset(pageNum: number, limit: number): number {
  return pageToOffset(pageNum, limit)
}

// ============================================================================
// Type Exports (for reference)
// ============================================================================

/**
 * The Post type extracted from the collection
 * Automatically includes optional auto-generated fields (id, createdAt, updatedAt)
 */
// export type Post = GetCollectionType<typeof posts>
// type Post = {
//   title: string;
//   content: string;
//   published: boolean;
//   author: string;
//   viewCount: number;
//   category: 'tech' | 'lifestyle' | 'business' | 'other' | undefined;
//   id?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// ============================================================================
// Usage Summary
// ============================================================================

/**
 * Offset Pagination Pros:
 * - Simple to understand and implement
 * - Supports random page access (jump to page 5)
 *
 * Offset Pagination Cons:
 * - Slower on large datasets (must scan all preceding rows)
 * - Total count can be expensive to calculate
 * - Results can be inconsistent with concurrent writes
 *
 * Best Practices:
 * - Use with smaller datasets (< 10,000 records)
 * - Consider cursor pagination for larger datasets
 * - Cache total counts when possible
 * - Use includeTotal: false when exact count isn't needed
 */
