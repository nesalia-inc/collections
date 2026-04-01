import { createPathProxy, extractPath, PathSymbol, pathToField, type PathProxy } from '../path'
import type { SelectNode, Selection } from './types'

// ============================================================================
// Select Builder Function
// ============================================================================

/**
 * Construit un AST de sélection
 * Usage: select<User>()(p => [p.id, p.email, p.author.name])
 *
 * Note: Pour les relations 1:N (tableaux), le type de retour sera un tableau.
 * L'implémentation actuelle gère les chemins plats et imbriqués.
 */
export const select = <TEntity>() => {
  return <TResult extends Record<string, unknown>>(
    builder: (p: PathProxy<TEntity>) => PathProxy<unknown>[]
  ): Selection<TEntity, TResult> => {
    const p = createPathProxy<TEntity>()
    const result = builder(p)

    const nodes: SelectNode[] = result.map(node => {
      const path = extractPath(node)
      const pathStrings = path.map(p => String(p))
      return {
        _tag: 'SelectNode',
        path: pathStrings,
        field: pathToField(pathStrings),
        isRelation: false, // Driver must detect based on schema
        isCollection: false, // Driver must detect based on schema
      }
    })

    return {
      _tag: 'Selection',
      ast: nodes,
    } as Selection<TEntity, TResult>
  }
}

/**
 * Helper to check if a value is a PathProxy (for validation)
 */
export function isPathProxy(value: unknown): value is PathProxy<unknown> {
  return typeof value === 'object' && value !== null && PathSymbol in value
}

/**
 * Convert path segments to SelectNode
 */
export function pathToSelectNode(path: string[]): SelectNode {
  return {
    _tag: 'SelectNode',
    path,
    field: path.join('.'),
    isRelation: false,
    isCollection: false,
  }
}
