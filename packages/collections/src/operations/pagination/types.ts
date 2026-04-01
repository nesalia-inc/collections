// Pagination Types - Offset and Cursor-based pagination

import type { PathProxy } from '../path'
import type { Predicate } from '../where'
import type { OrderBy } from '../order-by'
import type { ValidSelectValue } from '../select'

// ============================================================================
// Pagination Input Types
// ============================================================================

/**
 * Offset pagination input
 * Uses limit and offset directly (page = offset / limit + 1)
 */
export interface OffsetPaginationInput {
  readonly _tag: 'OffsetPagination'
  readonly limit: number
  readonly offset: number
  /** Whether to include total count (default: true) */
  readonly includeTotal?: boolean
}

/**
 * Cursor pagination input
 * Uses cursor values for navigation, more performant on large datasets
 */
export interface CursorPaginationInput {
  readonly _tag: 'CursorPagination'
  readonly limit: number
  /** Cursor value (opaque string, decoded internally) */
  readonly cursor?: string
  /** Whether to include total count (default: false for performance) */
  readonly includeTotal?: boolean
}

/**
 * Union type for pagination input
 * Offset and Cursor are mutually exclusive
 */
export type PaginationInput = OffsetPaginationInput | CursorPaginationInput

// ============================================================================
// Pagination Output Type
// ============================================================================

/**
 * Paginated result with data and navigation
 * Note: This object contains methods and is not JSON-serializable.
 * For API responses, extract data via current.data and compute pagination manually.
 */
export interface Paginated<T> {
  /** Current page data */
  readonly current: {
    /** Array of items in current page */
    readonly data: T[]
    /** Total count of all records */
    readonly total: number | null
    /** Max items per page */
    readonly limit: number
    /** Number of items skipped */
    readonly offset: number
  }
  /** Whether there is a next page (determined by fetching limit+1) */
  readonly hasNext: boolean
  /** Whether there is a previous page */
  readonly hasPrevious: boolean
  /** Navigate to next page (preserves original query) */
  next(): Promise<Paginated<T> | null>
  /** Navigate to previous page (preserves original query) */
  previous(): Promise<Paginated<T> | null>
}

// ============================================================================
// Cursor Utilities
// ============================================================================

/**
 * Cursor value from a record
 * Internal representation before encoding
 */
export interface CursorValue {
  /** OrderBy field values at the cursor position */
  readonly values: Record<string, unknown>
  /** The original orderBy AST path strings */
  readonly orderBy: readonly string[]
}

/**
 * Serialize a value for cursor encoding
 * Handles Date objects specially since JSON.stringify converts them to strings
 */
function serializeValue(value: unknown): string {
  if (value instanceof Date) {
    return `__date:${value.toISOString()}`
  }
  if (typeof value === 'object' && value !== null) {
    return `__json:${JSON.stringify(value)}`
  }
  return String(value)
}

/**
 * Deserialize a value from cursor decoding
 */
function deserializeValue(value: string): unknown {
  if (value.startsWith('__date:')) {
    return new Date(value.slice(7))
  }
  if (value.startsWith('__json:')) {
    return JSON.parse(value.slice(7))
  }
  return value
}

/**
 * Encode cursor value to opaque string for external use
 * Uses btoa/atob for universal (isomorphic) compatibility - works in Node.js, Browser, Deno, Edge
 */
export function encodeCursor(value: CursorValue): string {
  const serialized = {
    values: Object.fromEntries(
      Object.entries(value.values).map(([k, v]) => [k, serializeValue(v)])
    ),
    orderBy: value.orderBy,
  }
  const json = JSON.stringify(serialized)
  // btoa works in browsers and modern Node.js (v16+)
  return btoa(json)
}

/**
 * Decode cursor string to cursor value
 */
export function decodeCursor(encoded: string): CursorValue | null {
  try {
    const json = atob(encoded)
    const parsed = JSON.parse(json) as {
      values: Record<string, string>
      orderBy: readonly string[]
    }
    return {
      values: Object.fromEntries(
        Object.entries(parsed.values).map(([k, v]) => [k, deserializeValue(v)])
      ),
      orderBy: parsed.orderBy,
    }
  } catch {
    return null
  }
}

// ============================================================================
// Select Input for Pagination
// ============================================================================

/**
 * Select input function type for pagination
 */
export type PaginationSelectInput<T> = <TResult extends Record<string, ValidSelectValue>>(
  p: PathProxy<T>
) => TResult

// ============================================================================
// Query Snapshot
// ============================================================================

/**
 * Frozen snapshot of a query for navigation
 * Used by next()/previous() to replay exact query with modified cursor/offset
 */
export interface QuerySnapshot<TData, TSelect> {
  readonly where?: Predicate<TData>
  readonly select?: TSelect
  readonly orderBy?: OrderBy<TData>
  readonly pagination: PaginationInput
}

/**
 * Build a query snapshot for internal use
 */
export interface QuerySnapshotBuilder<TData, TSelect> {
  (p: PathProxy<TData>): {
    where?: Predicate<TData>
    select?: TSelect
    orderBy?: OrderBy<TData>
    pagination: PaginationInput
  }
}
