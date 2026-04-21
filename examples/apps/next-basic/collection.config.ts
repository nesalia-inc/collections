/**
 * Collection Config
 *
 * This file is used by the CLI to push schema changes to the database.
 * Run: npx @deessejs/collections db:push
 */

import { users, posts } from './src/collections'

export default {
  collections: {
    users,
    posts,
  },
  db: {
    type: 'postgres' as const,
    connectionString: process.env.DATABASE_URL!,
  },
}
