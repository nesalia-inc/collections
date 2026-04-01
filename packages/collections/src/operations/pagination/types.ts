// Pagination Types - Offset and Cursor-based pagination

import type { PathProxy } from '../path'
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
 * Immutable - next() and previous() return new instances
 */
export interface Paginated<T> {
  /** Current page data */
  readonly current: {
    /** Array of items in current page */
    readonly data: T[]
    /** Total count of all records (undefined if includeTotal: false) */
    readonly total?: number
    /** Max items per page */
    readonly limit: number
    /** Number of items skipped */
    readonly offset: number
  }
  /** Check if there is a next page */
  hasNext(): boolean
  /** Check if there is a previous page */
  hasPrevious(): boolean
  /** Navigate to next page (preserves original query) */
  next(): Promise<Paginated<T> | null>
  /** Navigate to previous page (preserves original query) */
  previous(): Promise<Paginated<T> | null>
  /** Get total count as Promise (lazy evaluation) */
  getTotal(): Promise<number | undefined>
}

// ============================================================================
// Cursor Utilities
// ============================================================================

/**
 * Cursor value from a record
 * Internal representation before base64 encoding
 */
export interface CursorValue {
  /** OrderBy field values at the cursor position */
  readonly values: Record<string, unknown>
  /** The original orderBy AST path strings */
  readonly orderBy: readonly string[]
}

/**
 * Encode cursor value to opaque string for external use
 */
export function encodeCursor(value: CursorValue): string {
  return Buffer.from(JSON.stringify(value)).toString('base64')
}

/**
 * Decode cursor string to cursor value
 */
export function decodeCursor(encoded: string): CursorValue | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8')
    return JSON.parse(decoded) as CursorValue
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
export interface QuerySnapshot<TSelect> {
  readonly where?: unknown // Predicate<TData>
  readonly select?: TSelect
  readonly orderBy?: unknown // OrderBy<TData>
  readonly pagination: PaginationInput
}

/**
 * Build a query snapshot for internal use
 */
export interface QuerySnapshotBuilder<TData, TSelect> {
  (p: PathProxy<TData>): {
    where?: unknown
    select?: TSelect
    orderBy?: unknown
    pagination: PaginationInput
  }
}
