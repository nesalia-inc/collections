import type { QueryOptions } from './types'

export const findMany = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  options?: QueryOptions
): Promise<Record<string, unknown>[]> => {
  let query = db.select().from(table)

  if (options?.where) {
    query = query.where(options.where)
  }

  if (options?.orderBy) {
    const orderByItems = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]
    query = query.orderBy(...orderByItems)
  }

  if (options?.take !== undefined) {
    query = query.limit(options.take)
  }

  if (options?.skip !== undefined) {
    query = query.offset(options.skip)
  }

  return query
}