// Validation helpers for column type functions

// Numeric validation
const MIN_PRECISION = 1
const MIN_SCALE = 0
export const isValidPrecisionScale = (precision: number, scale: number): boolean =>
  precision >= MIN_PRECISION && scale >= MIN_SCALE && precision >= scale

// Character validation
const MIN_LENGTH = 1
export const isValidLength = (length: number): boolean => length >= MIN_LENGTH

// Array validation
export const isNonEmptyArray = <T>(arr: T[]): boolean => arr !== null && arr !== undefined && arr.length > 0
export const hasNoDuplicates = <T>(arr: T[]): boolean => new Set(arr).size === arr.length
