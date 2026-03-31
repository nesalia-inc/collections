import type { WhereNode, Predicate } from './types'

// ============================================================================
// AST Builders
// ============================================================================

const eq = (field: string, value: unknown): WhereNode => ({ _tag: 'Eq', field, value })
const ne = (field: string, value: unknown): WhereNode => ({ _tag: 'Ne', field, value })
const gt = (field: string, value: unknown): WhereNode => ({ _tag: 'Gt', field, value })
const gte = (field: string, value: unknown): WhereNode => ({ _tag: 'Gte', field, value })
const lt = (field: string, value: unknown): WhereNode => ({ _tag: 'Lt', field, value })
const lte = (field: string, value: unknown): WhereNode => ({ _tag: 'Lte', field, value })
const like = (field: string, value: string): WhereNode => ({ _tag: 'Like', field, value })
const contains = (field: string, value: string): WhereNode => ({ _tag: 'Contains', field, value })
const startsWith = (field: string, value: string): WhereNode => ({ _tag: 'StartsWith', field, value })
const endsWith = (field: string, value: string): WhereNode => ({ _tag: 'EndsWith', field, value })
const regex = (field: string, value: string): WhereNode => ({ _tag: 'Regex', field, value })
const inOp = (field: string, value: unknown[]): WhereNode => ({ _tag: 'In', field, value })
const notIn = (field: string, value: unknown[]): WhereNode => ({ _tag: 'NotIn', field, value })
const between = (field: string, value: [unknown, unknown]): WhereNode => ({ _tag: 'Between', field, value })
const isNull = (field: string): WhereNode => ({ _tag: 'IsNull', field })
const isNotNull = (field: string): WhereNode => ({ _tag: 'IsNotNull', field })

const andNode = (nodes: WhereNode[]): WhereNode => ({ _tag: 'And', nodes })
const orNode = (nodes: WhereNode[]): WhereNode => ({ _tag: 'Or', nodes })
const notNode = (node: WhereNode): WhereNode => ({ _tag: 'Not', node })

// ============================================================================
// Field Proxy Types
// ============================================================================

type FieldProxy<T> = {
  [K in keyof T]: FieldValue<T[K]>
}

type FieldValue<T> = {
  eq: (value: T) => WhereNode
  ne: (value: T) => WhereNode
  gt: (value: T) => WhereNode
  gte: (value: T) => WhereNode
  lt: (value: T) => WhereNode
  lte: (value: T) => WhereNode
  between: (min: T, max: T) => WhereNode
  in: (values: T[]) => WhereNode
  notIn: (values: T[]) => WhereNode
  isNull: () => WhereNode
  isNotNull: () => WhereNode
  like: (value: string) => WhereNode
  contains: (value: string) => WhereNode
  startsWith: (value: string) => WhereNode
  endsWith: (value: string) => WhereNode
  regex: (value: string) => WhereNode
}

function createFieldProxy<T>(): FieldProxy<T> {
  return new Proxy({} as FieldProxy<T>, {
    get(_target, prop) {
      const field = String(prop)
      return {
        eq: (value: T) => eq(field, value),
        ne: (value: T) => ne(field, value),
        gt: (value: T) => gt(field, value),
        gte: (value: T) => gte(field, value),
        lt: (value: T) => lt(field, value),
        lte: (value: T) => lte(field, value),
        between: (min: T, max: T) => between(field, [min, max]),
        in: (values: T[]) => inOp(field, values),
        notIn: (values: T[]) => notIn(field, values),
        isNull: () => isNull(field),
        isNotNull: () => isNotNull(field),
        like: (value: string) => like(field, value),
        contains: (value: string) => contains(field, value),
        startsWith: (value: string) => startsWith(field, value),
        endsWith: (value: string) => endsWith(field, value),
        regex: (value: string) => regex(field, value),
      }
    },
  })
}

// ============================================================================
// Where Function
// ============================================================================

export const where = <T>(builder: (p: FieldProxy<T>) => WhereNode | WhereNode[]): Predicate<T> => {
  const p = createFieldProxy<T>()
  const result = builder(p)

  if (Array.isArray(result)) {
    return {
      _tag: 'Predicate',
      _entity: undefined as T,
      ast: andNode(result),
    }
  }

  return {
    _tag: 'Predicate',
    _entity: undefined as T,
    ast: result,
  }
}

// ============================================================================
// Logical Combinators
// ============================================================================

export const and = (...predicates: WhereNode[]): WhereNode => andNode(predicates)
export const or = (...predicates: WhereNode[]): WhereNode => orNode(predicates)
export const not = (predicate: WhereNode): WhereNode => notNode(predicate)

// ============================================================================
// Helper Functions (for convenience)
// ============================================================================

export const eqField = (field: string, value: unknown): WhereNode =>
  eq(field, value)
