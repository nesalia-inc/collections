import { createPathProxy, extractPath, PathSymbol, pathToField, type PathProxy } from '../path'
import type { SelectNode, Selection } from './types'

// ============================================================================
// Select Builder Function
// ============================================================================

/**
 * Build a selection AST using an object-based API
 * Usage: select<User>()(p => ({ id: p.id, name: p.name, author: { name: p.author.name } }))
 *
 * This approach allows TypeScript to infer the return type from the object keys.
 * Nested objects are supported recursively.
 */
export const select = <TEntity>() => {
  return <TResult extends Record<string, unknown>>(
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

    const nodes = collectNodes(result as Record<string, unknown>)

    return {
      _tag: 'Selection',
      ast: nodes,
    } as Selection<TEntity, TResult>
  }
}

/**
 * Recursively collect SelectNodes from an object structure
 * Supports nested objects like { author: { name: p.author.name } }
 */
function collectNodes(obj: Record<string, unknown>, prefix: string[] = []): SelectNode[] {
  const nodes: SelectNode[] = []

  for (const [key, value] of Object.entries(obj)) {
    if (isPathProxy(value)) {
      // Direct field access - extract path and use key as alias
      const path = extractPath(value)
      const pathStrings = path.map(segment => String(segment))
      const field = pathToField(pathStrings)

      nodes.push({
        _tag: 'SelectNode',
        path: pathStrings,
        field,
        alias: key !== field ? key : undefined, // Alias if key differs from field
        isRelation: false, // Requires schema integration
        isCollection: false, // Requires schema integration
      })
    } else if (typeof value === 'object' && value !== null) {
      // Nested object - recurse with prefix
      const nestedNodes = collectNodes(value as Record<string, unknown>, [...prefix, key])
      nodes.push(...nestedNodes)
    } else {
      throw new Error(
        `select: expected PathProxy or nested object for key "${key}", got ${typeof value}. ` +
        `Usage: select<User>()(p => ({ ${key}: p.${key} }))`
      )
    }
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
export function createSelectNode(path: string[], alias?: string): SelectNode {
  return {
    _tag: 'SelectNode',
    path,
    field: path.join('.'),
    alias,
    isRelation: false,
    isCollection: false,
  }
}
