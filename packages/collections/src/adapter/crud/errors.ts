// Error builders for CRUD operations

import { error } from '@deessejs/core'
import { z } from 'zod'

export const RecordNotFoundError = error({
  name: 'RecordNotFound',
  schema: z.object({
    id: z.string(),
  }),
})

export const InsertFailedError = error({
  name: 'InsertFailed',
  schema: z.object({
    reason: z.string().optional(),
  }),
})

export const InvalidPredicateError = error({
  name: 'InvalidPredicate',
  schema: z.object({
    reason: z.string(),
  }),
})
