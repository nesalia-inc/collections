import { createPathProxy, extractPath, pathToField, type PathProxy } from '../path'
import type { OrderNode, OrderBy } from './types'

// ============================================================================
// Order Terminals - asc/desc operators
// ============================================================================

export const asc = <T>(path: PathProxy<T>): OrderNode => ({
  _tag: 'OrderNode',
  field: pathToField(extractPath(path)),
  direction: 'asc',
})

export const desc = <T>(path: PathProxy<T>): OrderNode => ({
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
  builder: (p: PathProxy<T>) => OrderNode | OrderNode[]
): OrderBy<T> => {
  const p = createPathProxy<T>()
  const result = builder(p)

  const nodes: OrderNode[] = Array.isArray(result) ? result : [result]

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
function isOrderNode(value: unknown): value is OrderNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_tag' in value &&
    (value as Record<string, unknown>)['_tag'] === 'OrderNode' &&
    'field' in value &&
    'direction' in value &&
    ((value as { direction: unknown })['direction'] === 'asc' ||
      (value as { direction: unknown })['direction'] === 'desc')
  )
}
