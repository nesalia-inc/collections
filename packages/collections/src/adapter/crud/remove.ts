import { eq } from 'drizzle-orm'
import { err, isNone, ok, type Result, type Error } from '@deessejs/core'
import { RecordNotFoundError } from './errors'
import { findOne } from './findOne'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const remove = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  id: string,
  options?: {
    hooks?: {
      beforeDelete?: (data: Record<string, unknown>) => void | Promise<void>
      afterDelete?: (data: Record<string, unknown>) => void | Promise<void>
    }
  }
): Promise<Result<Record<string, unknown>, Error>> => {
  // Get record first for hooks
  const existingMaybe = await findOne(db, table, id)
  if (isNone(existingMaybe)) return err(RecordNotFoundError({ id }) as Error)

  const existing = existingMaybe.value

  // 1. Execute beforeDelete hook if present
  if (options?.hooks?.beforeDelete) {
    await options.hooks.beforeDelete(existing)
  }

  // 2. Delete from DB
  await db.delete(table).where(eq(table.id, id))

  // 3. Execute afterDelete hook if present
  if (options?.hooks?.afterDelete) {
    await options.hooks.afterDelete(existing)
  }

  return ok(existing)
}
