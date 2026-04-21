/**
 * MySQL Adapter
 *
 * Provides MySQL-specific implementation for the adapter layer.
 * Part of the two-layer adapter architecture:
 *   Collection → collectionToRawTable → RawTable (Mid-Level IR) → buildDrizzleTable → Drizzle Schema
 *
 * MySQL-specific notes:
 * - Uses `mysqlTable` instead of `pgTable` or `sqliteTable`
 * - VARCHAR requires a length (defaults to 255 if not specified)
 * - BOOLEAN type is supported natively
 * - JSON type is supported natively (no jsonb)
 * - UUID has no native support - stored as VARCHAR(36)
 * - TIMESTAMP does not support timezone (use datetime for timezone-aware data)
 * - SERIAL is implemented as int().autoincrement()
 * - PostgreSQL-only types (vector, halfvec, sparsevec, bit) are not supported
 */

export { buildDrizzleTable, createMysqlEnum, type BuildDrizzleTableResult } from './buildDrizzleTable'

export { createMysqlSchema, type CreateMysqlSchemaOptions } from './createMysqlSchema'
