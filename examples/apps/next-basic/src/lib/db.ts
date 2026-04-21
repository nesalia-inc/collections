/**
 * Database Singleton
 *
 * This module provides a singleton database instance for use across the Next.js app.
 * It uses the createCollections factory from @deessejs/collections with the PostgreSQL adapter.
 *
 * IMPORTANT: In Next.js, database connections must be managed carefully to avoid:
 * - Creating new connections on every request (memory leaks)
 * - Using connections in untrusted environments (security issues)
 *
 * This singleton pattern ensures:
 * - Single Pool instance across the application lifetime
 * - Lazy initialization on first access
 * - Type-safe access via DbAccess<TCollections>
 *
 * Usage in Server Components:
 * ```typescript
 * import { getDb } from '@/lib/db'
 *
 * export default async function Page() {
 *   const db = await getDb()
 *   const users = await db.users.findMany()
 *   // ...
 * }
 * ```
 *
 * Usage in API Routes:
 * ```typescript
 * import { getDb } from '@/lib/db'
 *
 * export async function GET() {
 *   const db = await getDb()
 *   const users = await db.users.findMany()
 *   return Response.json(users)
 * }
 * ```
 */

import { createCollections, postgres } from '@deessejs/collections'
import { isErr } from '@deessejs/core'
import { users, posts } from '../collections'
import type { DbAccess } from '@deessejs/collections'

// Type for our collections database access
type AppDb = DbAccess<typeof users | typeof posts>

// Module-level singleton instance
let dbInstance: AppDb | null = null
let initPromise: Promise<AppDb> | null = null

/**
 * Get or create the database singleton
 *
 * This function is idempotent - multiple calls return the same instance.
 * The first call triggers lazy initialization.
 *
 * @returns Promise resolving to the singleton DbAccess instance
 * @throws Error if DATABASE_URL is not set or connection fails
 */
export async function getDb(): Promise<AppDb> {
  // Return existing instance if already initialized
  if (dbInstance) {
    return dbInstance
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise
  }

  // Start lazy initialization
  initPromise = initializeDb()
  dbInstance = await initPromise
  return dbInstance
}

/**
 * Initialize the database connection
 */
async function initializeDb(): Promise<AppDb> {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
        'Please configure your PostgreSQL connection string in .env'
    )
  }

  const result = await createCollections({
    collections: [users, posts],
    db: postgres(databaseUrl),
  })

  if (isErr(result)) {
    throw new Error(`Failed to initialize database: ${result.error.message}`)
  }

  return result.value.db as AppDb
}

/**
 * Check if the database has been initialized
 * Useful for checks in non-async contexts or startup validation
 */
export function isDbInitialized(): boolean {
  return dbInstance !== null
}
