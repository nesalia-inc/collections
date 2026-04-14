import { defineConfig } from '@deessejs/collections'
import { todos } from './collections'

/**
 * App configuration
 *
 * Defines all collections available in this application.
 * The config object provides type-safe access to collection database methods.
 *
 * Note: Database methods (db.todos.findMany, etc.) require a database
 * adapter to be configured. See @deessejs/collections documentation for
 * database setup.
 */
export const config = defineConfig({
  collections: [todos],
})
