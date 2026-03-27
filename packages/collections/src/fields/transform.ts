// Transform utilities - safe transform execution with error boundaries

/**
 * TransformError - Error thrown when a transform fails
 */
export class TransformError extends Error {
  constructor(
    message: string,
    public readonly fieldType: string,
    public readonly value: unknown,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'TransformError'
  }
}

/**
 * safeTransform - Executes a transform function with error boundary
 * Provides context when transforms fail
 *
 * @param fieldType - The type name for error context
 * @param transform - The transform function to execute
 * @param value - The value to transform
 */
export function safeTransform<T>(
  fieldType: string,
  transform: (value: unknown) => T,
  value: unknown
): T {
  try {
    return transform(value)
  } catch (error) {
    throw new TransformError(
      `Transform failed for field type '${fieldType}': ${error instanceof Error ? error.message : String(error)}`,
      fieldType,
      value,
      error
    )
  }
}

/**
 * safeTransformArray - Executes a transform on each array element
 * Handles null/undefined inputs gracefully
 *
 * @param fieldType - The type name for error context
 * @param itemTransform - The transform function for each item
 * @param value - The value to transform (may be array or null)
 */
export function safeTransformArray<T>(
  fieldType: string,
  itemTransform: (value: unknown) => T,
  value: unknown
): T[] {
  if (!Array.isArray(value)) return []
  return value.map((item, index) => {
    try {
      return itemTransform(item)
    } catch (error) {
      throw new TransformError(
        `Transform failed for field type '${fieldType}' at index ${index}: ${error instanceof Error ? error.message : String(error)}`,
        fieldType,
        item,
        error
      )
    }
  })
}
