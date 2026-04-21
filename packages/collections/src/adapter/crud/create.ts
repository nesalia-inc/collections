import { err, attemptAsync, ok, isTryOk, type Result, type Error } from '@deessejs/core'

import { InsertFailedError } from './errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const create = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: any,
  data: Partial<Record<string, unknown>>,
  options?: {
    hooks?: {
      beforeCreate?: (data: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>
      afterCreate?: (data: Record<string, unknown>) => void | Promise<void>
    }
  }
): Promise<Result<Record<string, unknown>, Error>> => {
  // 1. Execute beforeCreate hook if present
  const dataToInsert = options?.hooks?.beforeCreate
    ? await options.hooks.beforeCreate(data)
    : data

  // 2. Insert into DB
  const dbResult = await attemptAsync(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => (db as any).insert(table).values(dataToInsert).returning() as Promise<Record<string, unknown>[]>
  )

  if (!isTryOk(dbResult)) {
    return err(dbResult.error as Error)
  }

  const result = dbResult.value

  // 3. Execute afterCreate hook if present
  if (options?.hooks?.afterCreate && result.length > 0) {
    await options.hooks.afterCreate(result[0])
  }

  if (result.length === 0) {
    return err(InsertFailedError({}) as Error)
  }

  return ok(result[0])
}
