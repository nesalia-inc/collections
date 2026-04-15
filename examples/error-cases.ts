/**
 * Error Cases Example
 *
 * This file demonstrates common error scenarios when working with collections.
 * Each example shows what error would occur and why.
 *
 * NOTE: This file is commented out where errors would occur, so it can be run.
 * Uncomment the code blocks to see the actual errors.
 */

import { collection, field, f } from '@deessejs/collections'
import { createSqliteSchema } from '@deessejs/collections/adapter/sqlite'
import { createPostgresSchema } from '@deessejs/collections/adapter/postgresql'

// =============================================================================
// 1. Invalid slug format (throws at collection() creation)
// =============================================================================

// Slugs must be lowercase, start with a letter, and contain only letters, numbers, hyphens/underscores.

// This would throw:
// const badCollection = collection({
//   slug: '123starts-with-number', // Invalid: starts with number
//   fields: { title: field({ fieldType: f.text() }) },
// })
// Error: "Invalid slug '123starts-with-number'. Slug must be lowercase, start with a letter..."

// This would throw:
// const badCollection = collection({
//   slug: 'has spaces', // Invalid: contains spaces
//   fields: { title: field({ fieldType: f.text() }) },
// })
// Error: "Invalid slug 'has spaces'. Slug must be lowercase, start with a letter..."

console.log('Example 1: Invalid slug format')
console.log('  Would throw: "Invalid slug..." if slug is not lowercase alphanumeric with hyphens/underscores\n')

// =============================================================================
// 2. Reserved field name (throws at collection() creation)
// =============================================================================

// Field names 'id', 'createdAt', and 'updatedAt' are reserved.

// This would throw:
// const badCollection = collection({
//   slug: 'posts',
//   fields: {
//     id: field({ fieldType: f.uuid() }), // 'id' is reserved
//   },
// })
// Error: "Field name 'id' is reserved..."

// This would throw:
// const badCollection = collection({
//   slug: 'posts',
//   fields: {
//     createdAt: field({ fieldType: f.timestamp() }), // 'createdAt' is reserved
//   },
// })
// Error: "Field name 'createdAt' is reserved..."

console.log('Example 2: Reserved field name')
console.log('  Would throw: "Field name \'createdAt\' is reserved..."\n')

// =============================================================================
// 3. SQLite stores JSON as text (expected behavior, not an error)
// =============================================================================

// SQLite doesn't have native JSON type, so JSON/JSONB fields are stored as text.
// This is expected behavior, not an error.

const items = collection({
  slug: 'items',
  fields: {
    name: field({ fieldType: f.text() }),
    metadata: field({ fieldType: f.json() }),
  },
})

// PostgreSQL: metadata is stored as json type
// SQLite: metadata is stored as text (JSON string)
// The application needs to parse/stringify JSON when using SQLite

const pgSchema = createPostgresSchema([items])
const sqliteSchema = createSqliteSchema([items])

console.log('Example 3: SQLite JSON handling (expected behavior)')
console.log('  PostgreSQL: metadata stored as native JSON type')
console.log('  SQLite: metadata stored as text (JSON string)')
console.log('  Application must parse/stringify JSON manually with SQLite\n')

// =============================================================================
// 4. Foreign key not created when target collection doesn't exist
// =============================================================================

// Relations are resolved by matching field names to collection slugs.
// If no matching collection exists, the FK is simply not created.

const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text() }),
    // 'author' field with f.relation() expects an 'author' collection to exist
    author: field({ fieldType: f.relation() }),
  },
})

// createPostgresSchema([posts])
// → posts.author is a uuid column
// → NO foreign key is created (because 'authors' collection doesn't exist)
// The column exists but has no referential integrity

console.log('Example 4: Foreign key not created')
console.log('  author field: uuid column exists but no FK constraint')
console.log('  (No \'authors\' collection to reference)\n')

// =============================================================================
// 5. UUID in SQLite is text (expected behavior)
// =============================================================================

// SQLite doesn't have a native UUID type. UUIDs are stored as text.
// Application must generate UUIDs manually (no defaultRandom in SQLite).

const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text() }),
    externalId: field({ fieldType: f.uuid() }),
  },
})

const pgUsers = createPostgresSchema([users])
const sqliteUsers = createSqliteSchema([users])

console.log('Example 5: SQLite UUID handling (expected behavior)')
console.log('  PostgreSQL: externalId stored as uuid type with defaultRandom()')
console.log('  SQLite: externalId stored as text, app must generate UUID\n')

console.log('Error Cases Example Complete!')
