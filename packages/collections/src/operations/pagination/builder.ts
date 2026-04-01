// Pagination Builder - Factory functions for pagination input

import type { CursorPaginationInput, OffsetPaginationInput, PaginationInput } from './types'

// ============================================================================
// Offset Pagination
// ============================================================================

/**
 * Create offset pagination input
 * @param limit - Maximum items per page
 * @param offset - Number of items to skip (offset = (page - 1) * limit)
 * @param includeTotal - Whether to include total count (default: true)
 */
export const offset = (
  limit: number,
  offset: number,
  includeTotal: boolean = true
): OffsetPaginationInput => ({
  _tag: 'OffsetPagination',
  limit,
  offset,
  includeTotal,
})

/**
 * Convert page number to offset
 * @param page - 1-based page number
 * @param limit - Items per page
 */
export const pageToOffset = (page: number, limit: number): number => (page - 1) * limit

/**
 * Helper to create offset pagination from page number
 * @param page - 1-based page number
 * @param limit - Items per page
 * @param includeTotal - Whether to include total count
 */
export const page = (
  page: number,
  limit: number,
  includeTotal: boolean = true
): OffsetPaginationInput => offset(limit, pageToOffset(page, limit), includeTotal)

// ============================================================================
// Cursor Pagination
// ============================================================================

/**
 * Create cursor pagination input
 * @param limit - Maximum items per page
 * @param cursor - Optional cursor value (base64 encoded or CursorValue)
 * @param includeTotal - Whether to include total count (default: false for performance)
 */
export const cursor = (
  limit: number,
  cursor?: string,
  includeTotal: boolean = false
): CursorPaginationInput => ({
  _tag: 'CursorPagination',
  limit,
  cursor,
  includeTotal,
})

/**
 * Create cursor pagination with manual value
 * @param limit - Maximum items per page
 * @param value - The cursor value to use
 * @param includeTotal - Whether to include total count
 */
export const cursorWithValue = (
  limit: number,
  value: Record<string, unknown>,
  includeTotal: boolean = false
): CursorPaginationInput => {
  // Encode the value to base64
  const encoded = Buffer.from(JSON.stringify(value)).toString('base64')
  return cursor(limit, encoded, includeTotal)
}

// ============================================================================
// Pagination Helpers
// ============================================================================

/**
 * Check if pagination input is offset-based
 */
export const isOffsetPagination = (input: PaginationInput): input is OffsetPaginationInput =>
  input._tag === 'OffsetPagination'

/**
 * Check if pagination input is cursor-based
 */
export const isCursorPagination = (input: PaginationInput): input is CursorPaginationInput =>
  input._tag === 'CursorPagination'

/**
 * Extract limit from pagination input
 */
export const getLimit = (input: PaginationInput): number => input.limit

/**
 * Extract offset from pagination input (returns 0 for cursor pagination)
 */
export const getOffset = (input: PaginationInput): number =>
  isOffsetPagination(input) ? input.offset : 0

/**
 * Check if total should be included
 */
export const shouldIncludeTotal = (input: PaginationInput): boolean =>
  input.includeTotal ?? false
