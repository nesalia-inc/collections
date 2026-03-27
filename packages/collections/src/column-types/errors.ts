// Error builders for column type validation

import { error } from '@deessejs/core'
import { z } from 'zod'

export const InvalidPrecisionScaleError = error({
  name: 'InvalidPrecisionScale',
  schema: z.object({
    precision: z.number(),
    scale: z.number(),
  }),
})

export const InvalidLengthError = error({
  name: 'InvalidLength',
  schema: z.object({
    length: z.number(),
  }),
})

export const InvalidEnumValuesError = error({
  name: 'InvalidEnumValues',
  schema: z.object({
    values: z.array(z.string()),
    reason: z.enum(['empty', 'duplicates']),
  }),
})
