/**
 * PostgreSQL Adapter
 *
 * Provides PostgreSQL-specific implementation for the adapter layer.
 * Part of the two-layer adapter architecture:
 *   Collection → collectionToRawTable → RawTable (Mid-Level IR) → buildDrizzleTable → Drizzle Schema
 */

export {
  buildDrizzleTable,
  createPgEnum,
  type BuildDrizzleTableResult,
} from './buildDrizzleTable'

export { createPostgresSchema } from './createPostgresSchema'