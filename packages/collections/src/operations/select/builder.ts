import { createPathProxy, extractPath, PathSymbol, pathToField, type PathProxy } from '../path'
import type { SelectNode, Selection } from './types'

// ============================================================================
// Select Builder Function
// ============================================================================

/**
 * Build a selection AST
 * Usage: select<User>()(p => [p.id, p.email, p.author.name])
 *
 * Note: This implementation does NOT automatically infer the return type.
 * The result must be typed manually or through schema integration.
 *
 * Limitations:
 * - Return type (TResult) must be provided manually or defaults to unknown
 * - For automatic DeepPick inference, consider object-based select syntax
 */
export const select = <TEntity>() => {
  return <TResult = unknown>(
    builder: (p: PathProxy<TEntity>) => PathProxy<unknown>[]
  ): Selection<TEntity, TResult> => {
    const p = createPathProxy<TEntity>()
    const result = builder(p)

    if (!Array.isArray(result)) {
      throw new Error(
        `select: expected array of paths, got ${typeof result}. ` +
        `Usage: select<User>()(p => [p.id, p.name])`
      )
    }

    const nodes: SelectNode[] = []

    for (const item of result) {
      if (!isPathProxy(item)) {
        throw new Error(
          `select: expected PathProxy from field access, got ${typeof item}. ` +
          `Did you forget to access a field? Usage: select<User>()(p => [p.id, p.name])`
        )
      }

      const path = extractPath(item)
      const pathStrings = path.map(segment => String(segment))

      nodes.push({
        _tag: 'SelectNode',
        path: pathStrings,
        field: pathToField(pathStrings),
        isRelation: false, // Requires schema integration to detect
        isCollection: false, // Requires schema integration to detect
      })
    }

    return {
      _tag: 'Selection',
      ast: nodes,
    } as Selection<TEntity, TResult>
  }
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
export function createSelectNode(path: string[]): SelectNode {
  return {
    _tag: 'SelectNode',
    path,
    field: path.join('.'),
    isRelation: false,
    isCollection: false,
  }
}
