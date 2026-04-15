/**
 * PostgreSQL vs SQLite Schema Comparison
 *
 * This example demonstrates how identical collection definitions produce
 * different schema outputs depending on the target database adapter.
 *
 * Key Differences at a Glance:
 * ┌──────────────┬──────────────────────────────────┬──────────────────────────────────┐
 * │ Field        │ PostgreSQL Type                   │ SQLite Type                       │
 * ├──────────────┼──────────────────────────────────┼──────────────────────────────────┤
 * │ text         │ varchar(255)                      │ text                              │
 * │ decimal      │ decimal(10, 2)                    │ real                              │
 * │ boolean      │ boolean                           │ integer (0/1)                     │
 * │ json         │ json                              │ text (JSON string)                │
 * │ uuid         │ uuid                              │ text                              │
 * │ select       │ text + pgEnum (database-level)    │ text                              │
 * │ timestamp    │ timestamp(3)                       │ integer (Unix timestamp)          │
 * │ timestampTz  │ timestamp(3) with timezone        │ integer (Unix timestamp)          │
 * │ id (default) │ uuid (auto, gen_random_uuid())    │ integer (auto-increment)          │
 * └──────────────┴──────────────────────────────────┴──────────────────────────────────┘
 */

import { collection, field, f } from '@deessejs/collections'
import { createPostgresSchema } from '@deessejs/collections/adapter/postgresql'
import { createSqliteSchema } from '@deessejs/collections/adapter/sqlite'

// =============================================================================
// STEP 1: Define an identical collection for both databases
// =============================================================================

const products = collection({
  slug: 'products',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    price: field({ fieldType: f.decimal(10, 2) }),
    inStock: field({ fieldType: f.boolean(), defaultValue: true }),
    metadata: field({ fieldType: f.json() }),
    sku: field({ fieldType: f.uuid() }),
    status: field({ fieldType: f.select(['active', 'discontinued'] as const) }),
    publishedAt: field({ fieldType: f.timestamp() }),
    deletedAt: field({ fieldType: f.timestampTz() }),
  },
})

// =============================================================================
// STEP 2: Generate schemas for both database adapters
// =============================================================================

const pgSchema = createPostgresSchema([products])
const sqliteSchema = createSqliteSchema([products])

// =============================================================================
// STEP 3: Key Differences Explained
// =============================================================================

/**
 * PostgreSQL Advantages:
 * ─────────────────────
 * - Native UUID type: Uses gen_random_uuid() for automatic UUID generation
 * - Native boolean type: Stores true/false directly
 * - Native JSON/JSONB: Full JSON manipulation at database level
 * - Native timestamp with timezone: Timezone-aware timestamps
 * - Native decimal: Exact precision for financial data
 * - pgEnum support: Database-level enum types with constraints
 *
 * SQLite Advantages:
 * ──────────────────
 * - Simplicity: No external dependencies, single-file database
 * - Portability: Easy to embed, backup, and move
 * - Speed: Faster for simple read-heavy workloads
 * - Zero configuration: Works out of the box
 *
 * SQLite Limitations:
 * ───────────────────
 * - No native UUID: Must generate in application code
 * - No native boolean: Uses integers 0 and 1
 * - No native JSON: JSON stored and retrieved as text, parsed in app
 * - No native date/time: Uses Unix timestamps (integers)
 * - No native decimal: Uses REAL (floating point) - precision issues
 * - No enum support: Stored as text, no database-level constraints
 */

// =============================================================================
// STEP 4: Code Examples - How to Insert Data
// =============================================================================

/**
 * PostgreSQL Example - Native types work directly:
 *
 * ```typescript
 * await db.insert(pgSchema.products).values({
 *   name: 'iPhone',
 *   price: 999.99,
 *   inStock: true,
 *   metadata: { brand: 'Apple', colors: ['black', 'white'] },
 *   sku: crypto.randomUUID(), // or use defaultRandom in schema
 *   status: 'active',
 *   createdAt: new Date(),
 *   deletedAt: null,
 * })
 * ```
 */

/**
 * SQLite Example - Requires application-level handling:
 *
 * ```typescript
 * await db.insert(sqliteSchema.products).values({
 *   name: 'iPhone',
 *   price: 999.99,
 *   inStock: 1, // SQLite uses 1 for true, 0 for false
 *   metadata: JSON.stringify({ brand: 'Apple', colors: ['black', 'white'] }),
 *   sku: crypto.randomUUID(),
 *   status: 'active',
 *   createdAt: Date.now(), // SQLite uses Unix timestamp (milliseconds)
 *   deletedAt: null,
 * })
 * ```
 */

/**
 * When to Choose PostgreSQL:
 * ──────────────────────────
 * - Financial data requiring decimal precision
 * - Complex JSON queries (JSONB operators)
 * - Timezone-aware timestamps
 * - Database-level enum validation
 * - UUID primary keys with automatic generation
 * - Multi-tenant applications with row-level security
 *
 * When to Choose SQLite:
 * ──────────────────────
 * - Simple CRUD applications
 * - Embedded devices or mobile apps
 * - Prototyping and local development
 * - Read-heavy workloads with simple queries
 * - When simplicity and portability matter more than features
 */

// =============================================================================
// STEP 5: Inspect the Generated Schemas (for debugging)
// =============================================================================

// Uncomment to see the generated Drizzle schemas:
// console.log('PostgreSQL Schema:', pgSchema)
// console.log('SQLite Schema:', sqliteSchema)

// Export for use in other files (useful for Drizzle migrations)
export { pgSchema, sqliteSchema }