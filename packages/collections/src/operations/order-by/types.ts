// Order-by Types - Type-safe ordering for collections

// ============================================================================
// Order Direction
// ============================================================================

export type OrderDirection = 'asc' | 'desc'

// ============================================================================
// Order Node - Single field ordering with phantom type
// ============================================================================

export interface OrderNode<T> {
  readonly _tag: 'OrderNode'
  /** Phantom type - prevents cross-entity mixing */
  readonly _entity?: T
  readonly field: string
  readonly direction: OrderDirection
}

// ============================================================================
// OrderBy - Builder result wrapper
// ============================================================================

export interface OrderBy<T> {
  readonly _tag: 'OrderBy'
  readonly _entity: T
  readonly ast: OrderNode<T>[]
}

// Accepts OrderBy wrapper, single OrderNode, or array of OrderNodes
export type OrderInput<T> = OrderBy<T> | OrderNode<T> | OrderNode<T>[]
