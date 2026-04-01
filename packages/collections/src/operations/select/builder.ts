import { createPathProxy, extractPath, PathSymbol, pathToField, type PathProxy } from '../path'
import type { SelectNode, Selection } from './types'

// ============================================================================
// Select Builder Function
// ============================================================================

/**
 * Build a selection AST using an object-based API
 * Usage: select<User>()(p => ({ id: p.id, name: p.name, author: p.author.name }))
 *
 * This approach allows TypeScript to infer the return type from the object keys.
 * Each property value must be a PathProxy (from field access).
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

    const nodes: SelectNode[] = []
    const entries = Object.entries(result as Record<string, unknown>)

    for (const [alias, value] of entries) {
      if (!isPathProxy(value)) {
        throw new Error(
          `select: expected PathProxy for field access, got ${typeof value} for key "${alias}". ` +
          `Usage: select<User>()(p => ({ ${alias}: p.${alias} }))`
        )
      }

      const path = extractPath(value)
      const pathStrings = path.map(segment => String(segment))

      nodes.push({
        _tag: 'SelectNode',
        path: pathStrings,
        field: pathToField(pathStrings),
        alias: pathStrings.length > 1 ? alias : undefined, // Use alias only if different from field
        isRelation: false,
        isCollection: false,
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
