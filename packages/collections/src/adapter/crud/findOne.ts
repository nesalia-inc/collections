import { eq } from 'drizzle-orm'
import { fromNullable, type Maybe } from '@deessejs/core'

export const findOne = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  id: string
): Promise<Maybe<Record<string, unknown>>> => {
  const result = await db.select().from(table).where(eq(table.id, id)).limit(1)
  return fromNullable(result[0])
}