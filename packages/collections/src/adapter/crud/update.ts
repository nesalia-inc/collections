import { eq } from 'drizzle-orm'
import { err, attemptAsync, ok, isTryOk, type Result, type Error } from '@deessejs/core'

import { RecordNotFoundError } from './errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const update = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  id: string,
  data: Partial<Record<string, unknown>>,
  options?: {
    hooks?: {
      beforeUpdate?: (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>
      afterUpdate?: (data: Record<string, unknown>) => void | Promise<void>
    }
  }
): Promise<Result<Record<string, unknown>, Error>> => {
  // 1. Execute beforeUpdate hook if present
  const dataToUpdate = options?.hooks?.beforeUpdate
    ? await options.hooks.beforeUpdate(data)
    : data

  // 2. Update in DB
  const dbResult = await attemptAsync(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => db.update(table).set(dataToUpdate).where(eq(table.id, id)).returning() as Promise<Record<string, unknown>[]>
  )

  if (!isTryOk(dbResult)) {
    return err(dbResult.error as Error)
  }

  const result = dbResult.value

  if (result.length === 0) {
    return err(RecordNotFoundError({ id }) as Error)
  }

  // 3. Execute afterUpdate hook if present
  if (options?.hooks?.afterUpdate) {
    await options.hooks.afterUpdate(result[0])
  }

  return ok(result[0])
}
