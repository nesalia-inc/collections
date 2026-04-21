import type { SQL } from 'drizzle-orm'

export const exists = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  where: SQL
): Promise<boolean> => {
  const result = await db.select({ id: table.id }).from(table).where(where).limit(1)
  return result.length > 0
}