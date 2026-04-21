import type { SQL } from 'drizzle-orm'
import { count as drizzleCount } from 'drizzle-orm'

export const count = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  options?: { where?: SQL }
): Promise<number> => {
  let query = db.select({ count: drizzleCount() }).from(table)

  if (options?.where) {
    query = query.where(options.where)
  }

  const result = await query
  return result[0]?.count ?? 0
}