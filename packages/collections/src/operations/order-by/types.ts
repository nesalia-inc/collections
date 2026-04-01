// Order-by Types - Type-safe ordering for collections

// ============================================================================
// Order Direction
// ============================================================================

export type OrderDirection = 'asc' | 'desc'

// ============================================================================
// Order Node - Single field ordering
// ============================================================================

export interface OrderNode {
  readonly _tag: 'OrderNode'
  readonly field: string
  readonly direction: OrderDirection
}

// ============================================================================
// OrderBy - Builder result wrapper
// ============================================================================

export interface OrderBy<T> {
  readonly _tag: 'OrderBy'
  readonly _entity: T
  readonly ast: OrderNode[]
}

// Accepts OrderBy wrapper, single OrderNode, or array of OrderNodes
export type OrderInput<T> = OrderBy<T> | OrderNode | OrderNode[]
