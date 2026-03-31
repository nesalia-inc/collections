import type {
  WhereNode,
  Predicate,
  PredicateInput,
} from './types'

// ============================================================================
// AST Builders (generic for type-safe construction)
// ============================================================================

const eq = <V>(field: string, value: V | null): WhereNode => ({ _tag: 'Eq', field, value })
const ne = <V>(field: string, value: V | null): WhereNode => ({ _tag: 'Ne', field, value })
const gt = <V>(field: string, value: V): WhereNode => ({ _tag: 'Gt', field, value })
const gte = <V>(field: string, value: V): WhereNode => ({ _tag: 'Gte', field, value })
const lt = <V>(field: string, value: V): WhereNode => ({ _tag: 'Lt', field, value })
const lte = <V>(field: string, value: V): WhereNode => ({ _tag: 'Lte', field, value })
const like = (field: string, value: string): WhereNode => ({ _tag: 'Like', field, value })
const contains = (field: string, value: string): WhereNode => ({ _tag: 'Contains', field, value })
const startsWith = (field: string, value: string): WhereNode => ({ _tag: 'StartsWith', field, value })
const endsWith = (field: string, value: string): WhereNode => ({ _tag: 'EndsWith', field, value })
const regex = (field: string, value: string): WhereNode => ({ _tag: 'Regex', field, value })
const inOp = <V>(field: string, values: V[]): WhereNode => ({ _tag: 'In', field, value: values })
const notIn = <V>(field: string, values: V[]): WhereNode => ({ _tag: 'NotIn', field, value: values })
const between = <V>(field: string, min: V, max: V): WhereNode => ({ _tag: 'Between', field, value: [min, max] })
const isNull = (field: string): WhereNode => ({ _tag: 'IsNull', field })
const isNotNull = (field: string): WhereNode => ({ _tag: 'IsNotNull', field })
const has = (field: string, value: unknown): WhereNode => ({ _tag: 'Has', field, value })
const hasAny = (field: string, values: unknown[]): WhereNode => ({ _tag: 'HasAny', field, value: values })
const overlaps = (field: string, values: unknown[]): WhereNode => ({ _tag: 'Overlaps', field, value: values })

const andNode = (nodes: WhereNode[]): WhereNode => ({ _tag: 'And', nodes })
const orNode = (nodes: WhereNode[]): WhereNode => ({ _tag: 'Or', nodes })
const notNode = (node: WhereNode): WhereNode => ({ _tag: 'Not', node })

// ============================================================================
// Operator Terminal Interface
// ============================================================================

// All operators available on any field (type-checking happens at SQL compilation)
interface OperatorTerminal {
  eq: (value: unknown) => WhereNode
  ne: (value: unknown) => WhereNode
  gt: (value: unknown) => WhereNode
  gte: (value: unknown) => WhereNode
  lt: (value: unknown) => WhereNode
  lte: (value: unknown) => WhereNode
  between: (min: unknown, max: unknown) => WhereNode
  in: (values: unknown[]) => WhereNode
  notIn: (values: unknown[]) => WhereNode
  isNull: () => WhereNode
  isNotNull: () => WhereNode
  like: (value: string) => WhereNode
  contains: (value: string) => WhereNode
  startsWith: (value: string) => WhereNode
  endsWith: (value: string) => WhereNode
  regex: (value: string) => WhereNode
  has: (value: unknown) => WhereNode
  hasAny: (values: unknown[]) => WhereNode
  overlaps: (values: unknown[]) => WhereNode
}

// ============================================================================
// Proxy Types - Using $ as terminator to avoid column name collision
// ============================================================================

// Path proxy - records field path
type PathProxy<T> = {
  [K in keyof T]: PathProxy<T[K]> & { $: OperatorTerminal }
}

// ============================================================================
// Operator Terminal Builder
// ============================================================================

function createOperatorTerminal(field: string): OperatorTerminal {
  return {
    eq: (value) => eq(field, value),
    ne: (value) => ne(field, value),
    gt: (value) => gt(field, value),
    gte: (value) => gte(field, value),
    lt: (value) => lt(field, value),
    lte: (value) => lte(field, value),
    between: (min, max) => between(field, min, max),
    in: (values) => inOp(field, values),
    notIn: (values) => notIn(field, values),
    isNull: () => isNull(field),
    isNotNull: () => isNotNull(field),
    like: (value) => like(field, value),
    contains: (value) => contains(field, value),
    startsWith: (value) => startsWith(field, value),
    endsWith: (value) => endsWith(field, value),
    regex: (value) => regex(field, value),
    has: (value) => has(field, value),
    hasAny: (values) => hasAny(field, values),
    overlaps: (values) => overlaps(field, values),
  }
}

// ============================================================================
// Recursive Path Proxy
// ============================================================================

function createPathProxy<T>(path: string[] = []): PathProxy<T> {
  return new Proxy({} as PathProxy<T>, {
    get(_target, prop) {
      const propStr = String(prop)

      if (propStr === '$') {
        // Terminal: switch to operator mode
        return createOperatorTerminal(path.join('.'))
      }

      // Continue path
      return createPathProxy([...path, propStr])
    },
  })
}

// ============================================================================
// Where Function
// ============================================================================

export const where = <T>(builder: (p: PathProxy<T>) => WhereNode | WhereNode[]): Predicate<T> => {
  const p = createPathProxy<T>()
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
// Search Operator
// ============================================================================

export const search = (fields: string[], value: string): WhereNode => ({
  _tag: 'Search',
  fields,
  value,
})

// ============================================================================
// Helper Functions
// ============================================================================

export const eqField = (field: string, value: unknown): WhereNode =>
  eq(field, value)
