import { createPathProxy, extractPath, PathSymbol, pathToField, type PathProxy } from '../path'
import type { SelectNode, Selection, ValidSelectValue } from './types'

// ============================================================================
// Select Builder Function
// ============================================================================

/**
 * Build a selection AST using an object-based API
 * Usage: select<User>()(p => ({ id: p.id, name: p.name, author: { name: p.author.name } }))
 *
 * This approach allows TypeScript to infer the return type from the object keys.
 * Nested objects are supported recursively.
 *
 * Type-safe: TResult is constrained to ValidSelectValue, so invalid inputs
 * like { age: 42 } will cause a compile-time error.
 */
export const select = <TEntity>() => {
  return <TResult extends Record<string, ValidSelectValue>>(
    builder: (p: PathProxy<TEntity>) => TResult
  ): Selection<TEntity, TResult> => {
    const p = createPathProxy<TEntity>()
    const result = builder(p)

    if (typeof result !== 'object' || result === null) {
      throw new Error(
        `select: expected object with field accesses, got ${typeof result}. ` +
        `Usage: select<User>()(p => ({ id: p.id, name: p.name }))`
      )
    }

    const nodes = collectNodes(result as Record<string, ValidSelectValue>)

    return {
      _tag: 'Selection',
      ast: nodes,
    } as Selection<TEntity, TResult>
  }
}

/**
 * Recursively collect SelectNodes from an object structure
 * Supports nested objects like { author: { name: p.author.name } }
 *
 * Alias is the FULL path in the result object, enabling the driver to
 * correctly reconstruct nested objects from flat SQL results.
 */
function collectNodes(obj: Record<string, ValidSelectValue>, prefix: string[] = []): SelectNode[] {
  const nodes: SelectNode[] = []

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = [...prefix, key]

    if (isPathProxy(value)) {
      // Direct field access
      const path = extractPath(value)
      const pathStrings = path.map(segment => String(segment))
      const field = pathToField(pathStrings)
      const alias = currentPath.join('.')

      nodes.push({
        _tag: 'SelectNode',
        path: pathStrings,
        field,
        alias, // Always present - complete path in result object
        isRelation: false, // Requires schema integration
        isCollection: false, // Requires schema integration
      })
    } else if (typeof value === 'object' && value !== null) {
      // Nested object - recurse
      const nestedNodes = collectNodes(value as Record<string, ValidSelectValue>, currentPath)
      nodes.push(...nestedNodes)
    }
    // ValidSelectValue ensures we never reach here for invalid inputs
  }

  return nodes
}

/**
 * Check if a value is a PathProxy
 */
export function isPathProxy(value: unknown): value is PathProxy<unknown> {
  return typeof value === 'object' && value !== null && PathSymbol in value
}

/**
 * Create a SelectNode from a path array
 */
export function createSelectNode(path: string[], alias: string): SelectNode {
  return {
    _tag: 'SelectNode',
    path,
    field: path.join('.'),
    alias,
    isRelation: false,
    isCollection: false,
  }
}
