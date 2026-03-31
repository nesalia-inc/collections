import type { WhereNode, Predicate, PredicateInput, OperatorName } from './types'
import { OPERATOR_NAMES } from './types'

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
// Operator Dispatch
// ============================================================================

type OperatorFn = (field: string, value: unknown) => WhereNode

const operatorFns: Record<OperatorName, OperatorFn> = {
  eq: (field, value) => eq(field, value),
  ne: (field, value) => ne(field, value),
  gt: (field, value) => gt(field, value),
  gte: (field, value) => gte(field, value),
  lt: (field, value) => lt(field, value),
  lte: (field, value) => lte(field, value),
  like: (field, value) => like(field, String(value)),
  contains: (field, value) => contains(field, String(value)),
  startsWith: (field, value) => startsWith(field, String(value)),
  endsWith: (field, value) => endsWith(field, String(value)),
  regex: (field, value) => regex(field, String(value)),
  in: (field, value) => inOp(field, value as unknown[]),
  notIn: (field, value) => notIn(field, value as unknown[]),
  between: (field, value) => between(field, value as [unknown, unknown]),
  isNull: (field) => isNull(field),
  isNotNull: (field) => isNotNull(field),
}

// ============================================================================
// Recursive Field Proxy
// ============================================================================

type FieldProxy<T> = {
  [K in keyof T]: T[K] extends object
    ? FieldValue<T[K]> & NestedFieldProxy<T[K]>
    : FieldValue<T[K]>
}

type NestedFieldProxy<T> = {
  [K in keyof T]?: T[K] extends object
    ? FieldValue<T[K]> & NestedFieldProxy<T[K]>
    : FieldValue<T[K]>
}

type FieldValue<T> = {
  eq: (value: T | null) => WhereNode
  ne: (value: T | null) => WhereNode
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

// Check if property is an operator name
function isOperator(prop: string): prop is OperatorName {
  return OPERATOR_NAMES.includes(prop as OperatorName)
}

// Create recursive field proxy with path tracking
function createFieldProxy<T>(path: string[] = []): FieldProxy<T> {
  return new Proxy({} as FieldProxy<T>, {
    get(_target, prop) {
      const propStr = String(prop)

      if (isOperator(propStr)) {
        const operatorFn = operatorFns[propStr]
        const field = path.join('.')
        return (value: unknown) => operatorFn(field, value)
      }

      // Nested path access - recurse with extended path
      return createFieldProxy([...path, propStr])
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
// Logical Combinators - Accept Predicate or WhereNode
// ============================================================================

// Extract WhereNode from PredicateInput
const toNode = <T>(input: PredicateInput<T>): WhereNode => {
  if ('_tag' in input && input._tag === 'Predicate') {
    return input.ast
  }
  return input as WhereNode
}

export const and = <T>(...inputs: PredicateInput<T>[]): WhereNode =>
  andNode(inputs.map(toNode))

export const or = <T>(...inputs: PredicateInput<T>[]): WhereNode =>
  orNode(inputs.map(toNode))

export const not = <T>(input: PredicateInput<T>): WhereNode =>
  notNode(toNode(input))

// ============================================================================
// Search Operator (global search across text fields)
// ============================================================================

// Create a search node - requires explicit text fields list
export const search = (fields: string[], value: string): WhereNode => ({
  _tag: 'Search',
  fields,
  value,
})

// ============================================================================
// Helper Functions (for convenience)
// ============================================================================

export const eqField = (field: string, value: unknown): WhereNode =>
  eq(field, value)
