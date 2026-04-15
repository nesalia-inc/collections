/**
 * Indexes and Constraints Example
 *
 * This file demonstrates how to define unique constraints, indexed fields,
 * and shows what the resulting DDL looks like in PostgreSQL.
 *
 * Note: This example focuses on showing what indexes look like in the generated DDL.
 * We don't actually connect to a database - we just build the schema and explain the output.
 */

import { collection, field, f } from '@deessejs/collections'
import { createPostgresSchema } from '@deessejs/collections/adapter/postgresql'

// =============================================================================
// 1. Collection with indexes and constraints
// =============================================================================

const posts = collection({
  slug: 'posts',
  fields: {
    // Unique constraint - ensures no duplicate slugs
    slug: field({ fieldType: f.text(), unique: true }),

    // Indexed field - speeds up queries like: WHERE category = 'tech'
    category: field({ fieldType: f.text(), indexed: true }),

    // Regular fields
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.text() }),
    author: field({ fieldType: f.relation() }),
    status: field({ fieldType: f.select(['draft', 'published', 'archived'] as const) }),
  },
})

// =============================================================================
// 2. Build the PostgreSQL schema
// =============================================================================

const pgSchema = createPostgresSchema([posts])

// =============================================================================
// 3. What these indexes look like in PostgreSQL DDL
// =============================================================================

/**
 * The schema above generates the following SQL when migrated to PostgreSQL:
 *
 * -- Primary key (implicit on 'id' field)
 * CREATE TABLE posts (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   slug varchar NOT NULL,
 *   category varchar,
 *   title varchar NOT NULL,
 *   content text,
 *   author uuid,
 *   status uuid,
 * );
 *
 * -- Unique index on slug (prevents duplicate slugs)
 * CREATE UNIQUE INDEX posts_slug_unique ON posts(slug);
 *
 * -- Regular index on category (speeds up category lookups)
 * CREATE INDEX posts_category_idx ON posts(category);
 */

// =============================================================================
// 4. Index verification
// =============================================================================

/**
 * The unique index on slug prevents duplicate slugs.
 * Example: Two posts cannot have the same slug value.
 *
 * The index on category speeds up queries like:
 *   SELECT * FROM posts WHERE category = 'tech'
 *
 * Note: Composite indexes (indexes on multiple columns) would require a
 * different API since field.indexed only works on single fields.
 */

// =============================================================================
// 5. Note about inspecting the schema
// =============================================================================

// Drizzle doesn't expose indexes on the table object directly.
// To verify indexes, you would need to inspect the migration output:
//
//   import { migrate } from 'drizzle-orm/node-postgres/migrator'
//   const migrationSQL = await migrate(pgSchema, { migrationsFolder: './drizzle' })
//
// Or use a tool like pg-drizzle to generate the DDL.

console.log('Posts table created with the following field configuration:')
console.log('- slug: unique (posts_slug_unique index)')
console.log('- category: indexed (posts_category_idx index)')
console.log('- title: required (no index)')
console.log('- content: optional (no index)')
console.log('- author: relation (no index)')
console.log('- status: select enum (no index)')

console.log('\nNote: Composite indexes require a different API since field.indexed only supports single fields.')
