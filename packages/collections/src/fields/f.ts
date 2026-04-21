// f - Predefined field types aggregator
// Re-exports builders from ./builders

import {
  text,
  email,
  url,
  number,
  decimal,
  boolean,
  date,
  timestamp,
  timestampTz,
  json,
  jsonb,
  uuid,
  select,
  relation,
  array,
  richtext,
  file,
  increment,
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
  text,
  email,
  url,
  number,
  decimal,
  boolean,
  date,
  timestamp,
  timestampTz,
  json,
  jsonb,
  uuid,
  select,
  relation,
  array,
  richtext,
  file,
  increment,
} as const
