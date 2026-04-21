import type { SQL } from 'drizzle-orm'

export interface QueryOptions {
  where?: SQL
  orderBy?: SQL | SQL[]
  take?: number
  skip?: number
}

export interface CreateOptions {
  hooks?: {
    beforeCreate?: (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>
    afterCreate?: (data: Record<string, unknown>) => void | Promise<void>
  }
}