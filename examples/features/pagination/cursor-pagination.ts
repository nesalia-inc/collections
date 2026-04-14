/**
 * Cursor-Based Pagination Example
 *
 * This example demonstrates how to use cursor-based pagination with findMany.
 * Cursor pagination is more performant on large datasets because it uses
 * keyset pagination (WHERE clause with indexed columns) instead of OFFSET.
 *
 * Use cursor pagination when:
 * - You have large datasets (> 10,000 records)
 * - You only need sequential navigation (next/previous)
 * - You need consistent results with concurrent writes
 * - You're building infinite scroll or "load more" features
 */

import { collection, field, f, cursor, cursorWithValue } from '@deessejs/collections'
import type { Paginated, CursorValue } from '@deessejs/collections'
import { encodeCursor, decodeCursor } from '@deessejs/collections'

// ============================================================================
// 1. Define a Collection
// ============================================================================

/**
 * Products collection - good candidate for cursor pagination
 * because product listings often need to handle large catalogs
 */
const products = collection({
  slug: 'products',
  name: 'Products',
  fields: {
    name: field({
      fieldType: f.text({ maxLength: 200 }),
      required: true,
    }),
    price: field({
      fieldType: f.decimal({ precision: 10, scale: 2 }),
      required: true,
    }),
    category: field({
      fieldType: f.text(),
      required: true,
    }),
    inStock: field({
      fieldType: f.boolean(),
      defaultFactory: () => true,
    }),
    rating: field({
      fieldType: f.number({ min: 0, max: 5 }),
    }),
    publishedAt: field({
      fieldType: f.timestamp(),
    }),
  },
})

// ============================================================================
// 2. Understanding Cursors
// ============================================================================

/**
 * A cursor is an opaque string that encodes:
 * 1. The values of the orderBy fields at the current position
 * 2. The orderBy field paths for reconstruction
 *
 * The cursor is base64-encoded and can be passed to the client.
 * Clients send the cursor back to get the next page.
 */

/**
 * Example: Cursor structure (before encoding)
 * This is what gets encoded into the cursor string
 */
const exampleCursorValue: CursorValue = {
  // The values of the orderBy fields at the cursor position
  values: {
    price: 99.99,
    publishedAt: '2024-01-15T10:30:00.000Z',
  },
  // The path strings used in orderBy
  orderBy: ['price', 'publishedAt'],
}

/**
 * Encode a cursor value to an opaque string
 * This is safe to pass to clients and store in URLs
 */
const encodedCursor = encodeCursor(exampleCursorValue)
console.log('Encoded cursor:', encodedCursor)

/**
 * Decode a cursor string back to values
 * Returns null if the cursor is invalid or expired
 */
const decodedCursor = decodeCursor(encodedCursor)
if (decodedCursor) {
  console.log('Decoded values:', decodedCursor.values)
  console.log('OrderBy paths:', decodedCursor.orderBy)
}

// ============================================================================
// 3. Creating Cursor Pagination Input
// ============================================================================

/**
 * Method A: Using cursor() with an encoded cursor string
 * - limit: Maximum items per page
 * - cursor: Optional encoded cursor from previous page
 * - includeTotal: Whether to include total count (default: false for performance)
 */
const cursorPagination = cursor(20, encodedCursor, false)

/**
 * Method B: Using cursorWithValue() when you have the raw values
 * Useful when building a cursor from known data (e.g., from search results)
 *
 * @param limit - Items per page
 * @param value - Record of field values to encode in cursor
 * @param orderBy - Array of field paths used for ordering
 * @param includeTotal - Whether to include total count
 */
const knownValues = { price: 50.00, publishedAt: new Date('2024-02-01') }
const cursorFromValues = cursorWithValue(20, knownValues, ['price', 'publishedAt'], false)

/**
 * Method C: Start with no cursor (first page)
 * Pass undefined or omit the cursor parameter
 */
const firstPageCursor = cursor(20, undefined, false)

// ============================================================================
// 4. Using Paginated Results
// ============================================================================

/**
 * Example: Fetching products with cursor pagination
 */
async function fetchProducts() {
  // Assume db is your Drizzle database instance
  // const db = drizzle(connectionString)
  // const productsCollection = createCollection(db, products)

  // First page - no cursor
  const firstPage = cursor(10, undefined, false)

  // const result: Paginated<Product> = await productsCollection.findMany({
  //   where: { inStock: true },
  //   orderBy: ['price', 'publishedAt'],
  //   pagination: firstPage,
  // })

  // Simulated result
  const result: Paginated<Product> = {
    current: {
      data: [],
      total: null, // cursor pagination doesn't include total by default
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

  // Current page data
  const items = result.current.data
  console.log(`Found ${items.length} products on this page`)

  // Total is null for cursor pagination by default
  console.log(`Total count: ${result.current.total}`) // null

  // Navigation state
  console.log(`Has next: ${result.hasNext}`)
  console.log(`Has previous: ${result.hasPrevious}`)

  // ============================================================================
  // Navigation with Cursors
  // ============================================================================

  // next() returns the next page and a new cursor
  if (result.hasNext) {
    const nextResult: Paginated<Product> | null = await result.next()

    if (nextResult && nextResult.current.data.length > 0) {
      // Get the cursor from the last item for stable pagination
      const lastItem = nextResult.current.data[nextResult.current.data.length - 1]
      const nextCursor = buildCursorFromItem(lastItem, ['price', 'publishedAt'])

      console.log('Next cursor:', nextCursor)
      console.log('Has more:', nextResult.hasNext)
    }
  }
}

// ============================================================================
// 5. Building Cursors from Items
// ============================================================================

/**
 * Build a cursor value from an item's field values
 * Use this when you need to create stable cursors for pagination
 */
function buildCursorFromItem(
  item: Product,
  orderByFields: string[]
): string {
  const values: Record<string, unknown> = {}

  for (const fieldPath of orderByFields) {
    // Handle nested paths like 'author.name'
    const parts = fieldPath.split('.')
    let value: unknown = item

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part]
      } else {
        value = undefined
        break
      }
    }

    values[fieldPath] = value
  }

  const cursorValue: CursorValue = {
    values,
    orderBy: orderByFields,
  }

  return encodeCursor(cursorValue)
}

/**
 * Example: Getting cursor from last item in results
 */
async function getCursorFromResults(results: Paginated<Product>): Promise<string | undefined> {
  const data = results.current.data

  if (data.length === 0) {
    return undefined
  }

  // Get the last item as cursor position
  const lastItem = data[data.length - 1]

  return buildCursorFromItem(lastItem, ['price', 'publishedAt'])
}

// ============================================================================
// 6. Handling Cursor Expiration
// ============================================================================

/**
 * Cursors can become invalid if:
 * - The underlying data has changed (rows deleted/updated)
 * - The cursor format has changed
 * - The cursor has expired (optional, application-specific)
 *
 * Always validate cursors and handle expired ones gracefully
 */
async function safeFetchWithCursor(
  cursorString: string | undefined,
  itemsPerPage: number = 20
) {
  // Validate cursor if provided
  if (cursorString) {
    const decoded = decodeCursor(cursorString)

    if (!decoded) {
      console.error('Invalid cursor provided')
      // Return first page instead of failing
      return fetchFirstPage(itemsPerPage)
    }

    // Optional: Check if cursor is expired
    const isExpired = await checkCursorExpiration(decoded)
    if (isExpired) {
      console.warn('Cursor expired, returning to first page')
      return fetchFirstPage(itemsPerPage)
    }
  }

  // const db = drizzle(connectionString)
  // const productsCollection = createCollection(db, products)

  const pagination = cursor(itemsPerPage, cursorString, false)

  // const result = await productsCollection.findMany({
  //   where: { inStock: true },
  //   orderBy: ['price', 'publishedAt'],
  //   pagination,
  // })

  return null // Placeholder
}

async function checkCursorExpiration(_cursor: CursorValue): Promise<boolean> {
  // Application-specific logic
  // For example, check if cursor contains a timestamp that's too old
  return false
}

async function fetchFirstPage(_itemsPerPage: number) {
  // const db = drizzle(connectionString)
  // const productsCollection = createCollection(db, products)

  const pagination = cursor(_itemsPerPage, undefined, false)

  // return productsCollection.findMany({
  //   orderBy: ['price', 'publishedAt'],
  //   pagination,
  // })

  return null
}

// ============================================================================
// 7. Complete Example: Product Catalog with Infinite Scroll
// ============================================================================

/**
 * Complete example of cursor pagination for infinite scroll
 */
async function productCatalogExample() {
  interface Product {
    id: string
    name: string
    price: number
    category: string
    inStock: boolean
    rating: number | undefined
    publishedAt: Date
  }

  // const db = drizzle(connectionString)
  // const productsCollection = createCollection(db, products)

  let currentCursor: string | undefined = undefined
  const itemsPerPage = 20
  const allProducts: Product[] = []

  // Fetch first page
  let result = await fetchPage(undefined, itemsPerPage)

  while (result && result.current.data.length > 0 && allProducts.length < 100) {
    // Add items to our list
    allProducts.push(...result.current.data)

    // Get cursor for next page
    currentCursor = await getCursorFromResults(result)

    if (!currentCursor || !result.hasNext) {
      break
    }

    // Fetch next page
    result = await fetchPage(currentCursor, itemsPerPage)
  }

  console.log(`Fetched ${allProducts.length} products total`)
}

/**
 * Fetch a page of products
 */
async function fetchPage(
  cursorString: string | undefined,
  limit: number
): Promise<Paginated<Product> | null> {
  // const db = drizzle(connectionString)
  // const productsCollection = createCollection(db, products)

  const pagination = cursor(limit, cursorString, false)

  // const result = await productsCollection.findMany({
  //   where: { inStock: true },
  //   orderBy: ['publishedAt', 'id'],
  //   pagination,
  // })

  // Simulated
  return {
    current: {
      data: [],
      total: null,
      limit,
      offset: 0,
    },
    hasNext: false,
    hasPrevious: cursorString !== undefined,
    next: async () => null,
    previous: async () => null,
  }
}

// ============================================================================
// Usage Summary
// ============================================================================

/**
 * Cursor Pagination Pros:
 * - Consistent results with concurrent writes
 * - Better performance on large datasets (no row scanning)
 * - Ideal for infinite scroll / "load more"
 *
 * Cursor Pagination Cons:
 * - No random page access (can't jump to page 5)
 * - No total count by default (can be expensive)
 * - Requires stable ordering (unique columns recommended)
 *
 * Best Practices:
 * - Always include a unique column (like 'id') in your orderBy
 * - This ensures cursor stability when rows have identical values
 * - Handle expired cursors gracefully
 * - Use includeTotal: false unless you really need the count
 */

// ============================================================================
// Type Exports (for reference)
// ============================================================================

/**
 * The Product type extracted from the collection
 */
// export type Product = GetCollectionType<typeof products>
