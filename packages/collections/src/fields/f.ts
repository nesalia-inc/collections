// f - Predefined field types aggregator
// Re-exports builders from ./builders

import {
  buildText,
  buildEmail,
  buildUrl,
  buildNumber,
  buildDecimal,
  buildBoolean,
  buildDate,
  buildTimestamp,
  buildTimestampTz,
  buildJson,
  buildJsonb,
  buildUuid,
  buildSelect,
  buildRelation,
  buildArray,
  buildRichtext,
  buildFile,
} from './builders'

/**
 * f - Predefined field types factory
 *
 * Provides common field types for building collections.
 *
 * @example
 * ```typescript
 * import { field, f } from '@deessejs/collections'
 *
 * const nameField = field({ fieldType: f.text() })
 * const emailField = field({ fieldType: f.email() })
 * const bioField = field({ fieldType: f.text({ maxLength: 1000 }) })
 * const statusField = field({ fieldType: f.select(['draft', 'published', 'archived']) })
 * ```
 */
export const f = {
  text: buildText,
  email: buildEmail,
  url: buildUrl,
  number: buildNumber,
  decimal: buildDecimal,
  boolean: buildBoolean,
  date: buildDate,
  timestamp: buildTimestamp,
  timestampTz: buildTimestampTz,
  json: buildJson,
  jsonb: buildJsonb,
  uuid: buildUuid,
  select: buildSelect,
  relation: buildRelation,
  array: buildArray,
  richtext: buildRichtext,
  file: buildFile,
} as const
