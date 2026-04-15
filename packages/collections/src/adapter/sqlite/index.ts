/**
 * SQLite Adapter
 *
 * Provides SQLite-specific implementation for the adapter layer.
 * Part of the two-layer adapter architecture:
 *   Collection → collectionToRawTable → RawTable (Mid-Level IR) → buildDrizzleTable → Drizzle Schema
 */

export {
  buildDrizzleTable,
  type BuildDrizzleTableResult,
} from './buildDrizzleTable'

export { createSqliteSchema } from './createSqliteSchema'