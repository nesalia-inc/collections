import { createPathProxy, extractPath, pathToField, type PathProxy } from '../path'
import type { OrderNode, OrderBy } from './types'

// ============================================================================
// Order Terminals - asc/desc operators
// ============================================================================

export const asc = <T>(path: PathProxy<T>): OrderNode<T> => ({
  _tag: 'OrderNode',
  field: pathToField(extractPath(path)),
  direction: 'asc',
})

export const desc = <T>(path: PathProxy<T>): OrderNode<T> => ({
  _tag: 'OrderNode',
  field: pathToField(extractPath(path)),
  direction: 'desc',
})

// ============================================================================
// OrderBy Builder Function
// ============================================================================

/**
 * Build an OrderBy AST from a builder function
 * Usage: orderBy<User>(p => [asc(p.lastName), desc(p.createdAt)])
 */
export const orderBy = <T>(
  builder: (p: PathProxy<T>) => OrderNode<T> | OrderNode<T>[]
): OrderBy<T> => {
  const p = createPathProxy<T>()
  const result = builder(p)

  const nodes: OrderNode<T>[] = Array.isArray(result) ? result : [result]

  // Validate each node has the expected structure
  for (const node of nodes) {
    if (!isOrderNode(node)) {
      throw new Error(
        `orderBy: expected OrderNode from asc() or desc(), got ${typeof node}. ` +
        `Did you forget to call asc() or desc()?`
      )
    }
  }

  return {
    _tag: 'OrderBy',
    _entity: undefined as unknown as T,
    ast: nodes,
  }
}

// Type guard for OrderNode
function isOrderNode(value: unknown): value is OrderNode<unknown> {
  return (
    value != null &&
    (value as { _tag?: string })._tag === 'OrderNode' &&
    (value as { direction?: string }).direction !== undefined
  )
}
