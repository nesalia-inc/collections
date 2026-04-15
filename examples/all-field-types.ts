/**
 * All Field Types Example
 *
 * This example demonstrates ALL supported field types in a single collection.
 * It shows how each field type maps to PostgreSQL and SQLite column types.
 *
 * Note: createdAt, updatedAt are reserved field names (auto-managed by the system).
 * Use different names like publishedAt, deletedAt, etc. for user-defined timestamp fields.
 */

import { collection, field, f } from '@deessejs/collections'
import { createPostgresSchema } from '@deessejs/collections/adapter/postgresql'
import { createSqliteSchema } from '@deessejs/collections/adapter/sqlite'

// =============================================================================
// Collection with ALL Field Types
// =============================================================================

const products = collection({
  slug: 'products',
  fields: {
    // Text types
    name: field({ fieldType: f.text(), required: true }),
    email: field({ fieldType: f.email() }),
    website: field({ fieldType: f.url() }),
    file: field({ fieldType: f.file() }),
    bio: field({ fieldType: f.richtext() }),

    // Number types
    price: field({ fieldType: f.decimal(10, 2) }),
    quantity: field({ fieldType: f.number() }),

    // Boolean
    inStock: field({ fieldType: f.boolean() }),

    // Date/Time
    // Note: createdAt, updatedAt are reserved - use different names
    birthDate: field({ fieldType: f.date() }),
    publishedAt: field({ fieldType: f.timestamp() }),
    deletedAt: field({ fieldType: f.timestampTz() }),

    // JSON
    metadata: field({ fieldType: f.json() }),
    config: field({ fieldType: f.jsonb() }),

    // Array
    tags: field({ fieldType: f.array(f.text()) }),

    // UUID
    externalId: field({ fieldType: f.uuid() }),

    // Select/Enum
    category: field({ fieldType: f.select(['electronics', 'clothing', 'food', 'books']) }),
    status: field({ fieldType: f.select(['active', 'draft', 'archived'] as const) }),
  },
})

// =============================================================================
// Generate Schema for Both Dialects
// =============================================================================

const pgSchema = createPostgresSchema([products])
const sqliteSchema = createSqliteSchema([products])

// =============================================================================
// Dialect-Specific Mapping
// =============================================================================

/**
 * PostgreSQL Type Mapping:
 * ────────────────────────
 * name         -> varchar(255)
 * email        -> varchar(255)
 * website      -> varchar(500)
 * file         -> varchar(500)
 * bio          -> text
 * price        -> decimal(10, 2)
 * quantity     -> integer
 * inStock      -> boolean
 * birthDate    -> date
 * publishedAt  -> timestamp(3)
 * deletedAt    -> timestamp(3) with timezone
 * metadata     -> json
 * config       -> jsonb
 * tags         -> json (array serialized as JSON)
 * externalId   -> uuid
 * category     -> text with enum constraint (pgEnum)
 * status       -> text with enum constraint (pgEnum)
 *
 * SQLite Type Mapping:
 * ────────────────────
 * name         -> text
 * email        -> text
 * website      -> text
 * file         -> text
 * bio          -> text
 * price        -> real (no decimal type - precision loss)
 * quantity     -> integer
 * inStock      -> integer (0/1)
 * birthDate    -> integer (Unix timestamp)
 * publishedAt  -> integer (Unix timestamp)
 * deletedAt    -> integer (Unix timestamp)
 * metadata     -> text (JSON stored as string)
 * config       -> text (JSON stored as string)
 * tags         -> text (JSON array as string)
 * externalId   -> text
 * category     -> text (no enum - no constraints)
 * status       -> text (no enum - no constraints)
 */

// =============================================================================
// CRUD Examples
// =============================================================================

/**
 * Create product with all fields (PostgreSQL):
 *
 * ```typescript
 * await create(db, pgSchema.products, {
 *   name: 'iPhone 15 Pro',
 *   email: 'contact@apple.com',
 *   website: 'https://apple.com/iphone',
 *   file: '/uploads/iphone-15-pro.jpg',
 *   bio: '<p>The latest iPhone with A17 Pro chip</p>',
 *   price: 999.99,
 *   quantity: 100,
 *   inStock: true,
 *   birthDate: new Date('2023-09-12'),
 *   publishedAt: new Date(),
 *   deletedAt: null,
 *   category: 'electronics',
 *   status: 'active',
 *   tags: ['smartphone', 'apple', '5g'],
 *   externalId: crypto.randomUUID(),
 *   metadata: { brand: 'Apple', model: 'iPhone 15 Pro' },
 *   config: { warranty: '1 year', insurance: true },
 * })
 * ```
 *
 * Create product with all fields (SQLite):
 * Note: SQLite stores booleans as 0/1, dates as Unix timestamps, and JSON as strings.
 *
 * ```typescript
 * await create(db, sqliteSchema.products, {
 *   name: 'iPhone 15 Pro',
 *   email: 'contact@apple.com',
 *   website: 'https://apple.com/iphone',
 *   file: '/uploads/iphone-15-pro.jpg',
 *   bio: '<p>The latest iPhone with A17 Pro chip</p>',
 *   price: 999.99,
 *   quantity: 100,
 *   inStock: 1, // SQLite uses 1 for true, 0 for false
 *   birthDate: Math.floor(new Date('2023-09-12').getTime() / 1000),
 *   publishedAt: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
 *   deletedAt: null,
 *   category: 'electronics',
 *   status: 'active',
 *   tags: JSON.stringify(['smartphone', 'apple', '5g']),
 *   externalId: crypto.randomUUID(),
 *   metadata: JSON.stringify({ brand: 'Apple', model: 'iPhone 15 Pro' }),
 *   config: JSON.stringify({ warranty: '1 year', insurance: true }),
 * })
 * ```
 */

/**
 * Read product (both dialects - Drizzle handles type mapping):
 *
 * ```typescript
 * const product = await db.select().from(pgSchema.products).where(
 *   eq(pgSchema.products.externalId, 'some-uuid')
 * ).limit(1)
 *
 * // product[0].price is a string in PostgreSQL (decimal stored as string)
 * // product[0].price is a number in SQLite (real)
 * ```
 */

/**
 * Update product:
 *
 * ```typescript
 * await update(db, pgSchema.products, productId, {
 *   price: 1099.99,
 *   status: 'draft',
 *   tags: [...],
 * })
 * ```
 */

/**
 * Delete product:
 *
 * ```typescript
 * await delete(db, pgSchema.products, productId)
 * ```
 */

// =============================================================================
// Console Output
// =============================================================================

console.log('All Field Types Example')
console.log('========================')
console.log('')

// Note: Drizzle tables don't expose columns as a simple object.
// Use the schema with drizzle-inspector or migration files to see the structure.

console.log('PostgreSQL product table structure:')
console.log('  id: uuid (primary key, auto-generated UUID)')
console.log('  name: varchar (required)')
console.log('  email: varchar')
console.log('  website: varchar')
console.log('  file: varchar')
console.log('  bio: text (richtext)')
console.log('  price: decimal(10, 2)')
console.log('  quantity: integer')
console.log('  in_stock: boolean')
console.log('  birth_date: date')
console.log('  published_at: timestamp')
console.log('  deleted_at: timestamptz')
console.log('  metadata: json')
console.log('  config: jsonb')
console.log('  tags: json (array)')
console.log('  external_id: uuid')
console.log('  category: text + enum (PostgreSQL)')
console.log('  status: text + enum (PostgreSQL)')

console.log('')
console.log('SQLite product table structure:')
console.log('  id: text (primary key, UUID as text)')
console.log('  name: text (required)')
console.log('  email: text')
console.log('  website: text')
console.log('  file: text')
console.log('  bio: text')
console.log('  price: real (no decimal)')
console.log('  quantity: integer')
console.log('  in_stock: integer 0/1')
console.log('  birth_date: integer (Unix timestamp)')
console.log('  published_at: integer (Unix timestamp)')
console.log('  deleted_at: integer (Unix timestamp)')
console.log('  metadata: text (JSON string)')
console.log('  config: text (JSON string)')
console.log('  tags: text (JSON array string)')
console.log('  external_id: text')
console.log('  category: text')
console.log('  status: text')
