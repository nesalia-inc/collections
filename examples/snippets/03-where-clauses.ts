/**
 * @deessejs/collections Snippet 03: Where Clauses
 *
 * This example demonstrates how to build type-safe where clauses
 * using the @deessejs/collections query builder.
 *
 * Run with: npx tsx examples/snippets/03-where-clauses.ts
 */

import { collection, field, f, where, eq, ne, gt, gte, lt, lte, and, or, not } from '@deessejs/collections'
import { between, inList, notInList, isNull, isNotNull, like, contains, startsWith, endsWith, regex } from '@deessejs/collections'

// =============================================================================
// Collection Setup
// =============================================================================

/**
 * Define a collection for our examples
 */
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.text() }),
    status: field({ fieldType: f.select(['draft', 'published', 'archived']), required: true }),
    viewCount: field({ fieldType: f.number() }),
    publishedAt: field({ fieldType: f.timestamp() }),
    authorId: field({ fieldType: f.uuid() }),
    category: field({ fieldType: f.text() }),
    tags: field({ fieldType: f.array(f.text()) }),
  },
})

// =============================================================================
// Type-Safe Path Proxies
// =============================================================================

/**
 * The where(), eq(), gt(), etc. functions use PathProxy to provide
 * type-safe field references. You pass a generic type parameter
 * representing your entity type, and then access fields via property access.
 *
 * This provides compile-time safety - TypeScript will error if you
 * reference a field that doesn't exist.
 */
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
  tags: string[]
}

// =============================================================================
// Equality Operators
// =============================================================================

/**
 * eq(field, value) - Equal to
 * ne(field, value) - Not equal to
 */
const eqExample = where<PostEntity>((p) => [
  eq(p.status, 'published'),
])

const neExample = where<PostEntity>((p) => [
  ne(p.status, 'archived'),
])

// =============================================================================
// Comparison Operators
// =============================================================================

/**
 * gt(field, value) - Greater than
 * gte(field, value) - Greater than or equal
 * lt(field, value) - Less than
 * lte(field, value) - Less than or equal
 */
const gtExample = where<PostEntity>((p) => [
  gt(p.viewCount, 100),
])

const gteExample = where<PostEntity>((p) => [
  gte(p.viewCount, 50),
])

const ltExample = where<PostEntity>((p) => [
  lt(p.publishedAt, new Date('2024-01-01')),
])

const lteExample = where<PostEntity>((p) => [
  lte(p.viewCount, 10),
])

// =============================================================================
// Between and List Operators
// =============================================================================

/**
 * between(field, min, max) - Value is between two values (inclusive)
 * inList(field, [values]) - Value is in a list
 * notInList(field, [values]) - Value is not in a list
 */
const betweenExample = where<PostEntity>((p) => [
  between(p.viewCount, 10, 100),
])

const inListExample = where<PostEntity>((p) => [
  inList(p.status, ['draft', 'published']),
])

const notInListExample = where<PostEntity>((p) => [
  notInList(p.category, ['spam', 'ads']),
])

// =============================================================================
// Null Operators
// =============================================================================

/**
 * isNull(field) - Field value is null
 * isNotNull(field) - Field value is not null
 */
const isNullExample = where<PostEntity>((p) => [
  isNull(p.publishedAt),
])

const isNotNullExample = where<PostEntity>((p) => [
  isNotNull(p.category),
])

// =============================================================================
// String Operators
// =============================================================================

/**
 * like(field, pattern) - LIKE pattern matching (SQL LIKE %pattern%)
 * contains(field, value) - Contains substring (uses LIKE %value%)
 * startsWith(field, value) - Starts with prefix (uses LIKE value%)
 * endsWith(field, value) - Ends with suffix (uses LIKE %value)
 * regex(field, pattern) - Regular expression match
 */
const likeExample = where<PostEntity>((p) => [
  like(p.title, '%Introduction%'),
])

const containsExample = where<PostEntity>((p) => [
  contains(p.title, 'TypeScript'),
])

const startsWithExample = where<PostEntity>((p) => [
  startsWith(p.title, 'How to'),
])

const endsWithExample = where<PostEntity>((p) => [
  endsWith(p.title, 'Guide'),
])

const regexExample = where<PostEntity>((p) => [
  regex(p.title, '^\\d+\\.\\s+'), // Starts with number followed by period
])

// =============================================================================
// Logical Combinators
// =============================================================================

/**
 * where() with multiple conditions creates an implicit AND
 * and(...predicates) - Combines predicates with AND
 * or(...predicates) - Combines predicates with OR
 * not(predicate) - Negates a predicate
 */
const andExample = where<PostEntity>((p) => [
  and(
    eq(p.status, 'published'),
    gte(p.viewCount, 50),
    isNotNull(p.publishedAt)
  ),
])

const orExample = where<PostEntity>((p) => [
  or(
    eq(p.status, 'published'),
    gte(p.viewCount, 1000)
  ),
])

const complexExample = where<PostEntity>((p) => [
  and(
    eq(p.status, 'published'),
    or(
      gte(p.viewCount, 100),
      eq(p.category, 'featured')
    )
  ),
])

// Using not()
const notExample = where<PostEntity>((p) => [
  not(eq(p.status, 'archived')),
])

// =============================================================================
// Advanced: Nested Field Access
// =============================================================================

/**
 * For nested objects, you can access fields using dot notation:
 * p.author.name, p.profile.address.city, etc.
 *
 * Note: This requires your collection to have nested object fields defined.
 * See the relations example for more on this.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const nestedEntity = {
  author: {
    name: 'John',
    profile: {
      city: 'New York',
    },
  },
}

// Example with nested access (conceptual - would need nested field definitions):
// const nestedExample = where((p) => [
//   eq(p.author.profile.city, 'New York'),
// ])

// =============================================================================
// Array Operators (for array fields)
// =============================================================================

/**
 * For array fields (like tags: string[]), you can use:
 * has(field, value) - Array contains value
 * hasAny(field, [values]) - Array contains any of values
 * overlaps(field, [values]) - Array overlaps with values
 */
const arrayHasExample = where<PostEntity>((p) => [
  // Note: Would need array field operators
  // has(p.tags, 'typescript'),
])

// =============================================================================
// Using Where Clauses with Operations
// =============================================================================

/**
 * Where clauses are used with database operations:
 * - db.findMany({ where: predicate })
 * - db.findFirst({ where: predicate })
 * - db.update({ where: predicate, data: {...} })
 * - db.delete({ where: predicate })
 *
 * The exact API depends on your database driver integration.
 */

// Example: Building a query object (conceptual - driver-specific)
interface QueryOptions {
  where?: ReturnType<typeof where<PostEntity>>
  limit?: number
  offset?: number
}

const queryOptions: QueryOptions = {
  where: where<PostEntity>((p) => [
    and(
      eq(p.status, 'published'),
      gte(p.viewCount, 10)
    ),
  ]),
  limit: 10,
  offset: 0,
}

// =============================================================================
// Usage Example
// =============================================================================

console.log('=== @deessejs/collections - Where Clauses ===')
console.log('')
console.log('Equality examples:')
console.log('- eq:', JSON.stringify(eqExample.ast, null, 2))
console.log('- ne:', JSON.stringify(neExample.ast, null, 2))
console.log('')
console.log('Comparison examples:')
console.log('- gt:', JSON.stringify(gtExample.ast, null, 2))
console.log('- lt:', JSON.stringify(ltExample.ast, null, 2))
console.log('')
console.log('Between and list examples:')
console.log('- between:', JSON.stringify(betweenExample.ast, null, 2))
console.log('- inList:', JSON.stringify(inListExample.ast, null, 2))
console.log('')
console.log('String operators:')
console.log('- contains:', JSON.stringify(containsExample.ast, null, 2))
console.log('- startsWith:', JSON.stringify(startsWithExample.ast, null, 2))
console.log('')
console.log('Logical combinators:')
console.log('- and:', JSON.stringify(andExample.ast, null, 2))
console.log('- or:', JSON.stringify(orExample.ast, null, 2))
console.log('- complex:', JSON.stringify(complexExample.ast, null, 2))
console.log('')
console.log('Where clause examples complete!')
