import type { WhereNode, Predicate, PredicateInput } from './types'

// ============================================================================
// Path Symbol - Internal Symbol to store path on proxy
// ============================================================================

const PathSymbol = Symbol('Path')

type PathSegment = string | number

// Helper type to access path via Symbol
interface PathCarrier {
  [PathSymbol]: PathSegment[]
}

// ============================================================================
// Path Proxy - Records field path via internal Symbol
// ============================================================================

type PathProxy<T> = {
  [K in keyof T]: PathProxy<T[K]>
} & {
  [Symbol.iterator](): Iterator<PathSegment>
  (value: unknown): WhereNode  // Callable for equality shorthand
}

// Create a path proxy that stores accumulated path via Symbol
function createPathProxy<T>(path: PathSegment[] = []): PathProxy<T> {
  // Create a function that acts as the base proxy target
  function proxyFunc(this: unknown): WhereNode {
    // Callable shorthand: p.name(value) === eq(p.name, value)
    return eqOp(proxyFunc as unknown as PathProxy<T>, undefined as unknown)
  }

  // Attach Symbol property to store path
  Object.defineProperty(proxyFunc, PathSymbol, {
    value: path,
    writable: false,
    enumerable: false,
  })

  // Cast to PathCarrier to access Symbol property
  const carrier = proxyFunc as unknown as PathCarrier

  // Return proxy that tracks path on property access
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Proxy(carrier as any, {
    get(_target, prop) {
      if (prop === Symbol.iterator) {
        return function* () {
          const p = carrier[PathSymbol]
          yield* p
        }
      }

      const currentPath = carrier[PathSymbol]
      const propStr = String(prop)

      // Create new proxy with extended path
      const newPath = [...currentPath, propStr]
      return createPathProxy<T>(newPath)
    },
  }) as PathProxy<T>
}

// ============================================================================
// Operator Functions (Applicative Style - no $)
// ============================================================================

// Extract path from a PathProxy via internal Symbol
function extractPath<T>(proxy: PathProxy<T>): PathSegment[] {
  return (proxy as unknown as PathCarrier)[PathSymbol]
}

function pathToField(path: PathSegment[]): string {
  return path.join('.')
}

// Base comparison operators
const eqOp = <T>(proxy: PathProxy<T>, value: unknown): WhereNode => ({
  _tag: 'Eq',
  field: pathToField(extractPath(proxy)),
  value,
})

const neOp = <T>(proxy: PathProxy<T>, value: unknown): WhereNode => ({
  _tag: 'Ne',
  field: pathToField(extractPath(proxy)),
  value,
})

const gtOp = <T>(proxy: PathProxy<T>, value: unknown): WhereNode => ({
  _tag: 'Gt',
  field: pathToField(extractPath(proxy)),
  value,
})

const gteOp = <T>(proxy: PathProxy<T>, value: unknown): WhereNode => ({
  _tag: 'Gte',
  field: pathToField(extractPath(proxy)),
  value,
})

const ltOp = <T>(proxy: PathProxy<T>, value: unknown): WhereNode => ({
  _tag: 'Lt',
  field: pathToField(extractPath(proxy)),
  value,
})

const lteOp = <T>(proxy: PathProxy<T>, value: unknown): WhereNode => ({
  _tag: 'Lte',
  field: pathToField(extractPath(proxy)),
  value,
})

const inOpFn = <T>(proxy: PathProxy<T>, values: unknown[]): WhereNode => ({
  _tag: 'In',
  field: pathToField(extractPath(proxy)),
  value: values,
})

const notInOp = <T>(proxy: PathProxy<T>, values: unknown[]): WhereNode => ({
  _tag: 'NotIn',
  field: pathToField(extractPath(proxy)),
  value: values,
})

const betweenOp = <T>(proxy: PathProxy<T>, min: unknown, max: unknown): WhereNode => ({
  _tag: 'Between',
  field: pathToField(extractPath(proxy)),
  value: [min, max],
})

const isNullOp = <T>(proxy: PathProxy<T>): WhereNode => ({
  _tag: 'IsNull',
  field: pathToField(extractPath(proxy)),
})

const isNotNullOp = <T>(proxy: PathProxy<T>): WhereNode => ({
  _tag: 'IsNotNull',
  field: pathToField(extractPath(proxy)),
})

// String-specific operators
const likeOp = <T>(proxy: PathProxy<T>, value: string): WhereNode => ({
  _tag: 'Like',
  field: pathToField(extractPath(proxy)),
  value,
})

const containsOp = <T>(proxy: PathProxy<T>, value: string): WhereNode => ({
  _tag: 'Contains',
  field: pathToField(extractPath(proxy)),
  value,
})

const startsWithOp = <T>(proxy: PathProxy<T>, value: string): WhereNode => ({
  _tag: 'StartsWith',
  field: pathToField(extractPath(proxy)),
  value,
})

const endsWithOp = <T>(proxy: PathProxy<T>, value: string): WhereNode => ({
  _tag: 'EndsWith',
  field: pathToField(extractPath(proxy)),
  value,
})

const regexOp = <T>(proxy: PathProxy<T>, value: string): WhereNode => ({
  _tag: 'Regex',
  field: pathToField(extractPath(proxy)),
  value,
})

// Array operators
const hasOp = <T>(proxy: PathProxy<T>, value: unknown): WhereNode => ({
  _tag: 'Has',
  field: pathToField(extractPath(proxy)),
  value,
})

const hasAnyOp = <T>(proxy: PathProxy<T>, values: unknown[]): WhereNode => ({
  _tag: 'HasAny',
  field: pathToField(extractPath(proxy)),
  value: values,
})

const overlapsOp = <T>(proxy: PathProxy<T>, values: unknown[]): WhereNode => ({
  _tag: 'Overlaps',
  field: pathToField(extractPath(proxy)),
  value: values,
})

// Logical combinators
const andNode = (nodes: WhereNode[]): WhereNode => ({ _tag: 'And', nodes })
const orNode = (nodes: WhereNode[]): WhereNode => ({ _tag: 'Or', nodes })
const notNode = (node: WhereNode): WhereNode => ({ _tag: 'Not', node })

// ============================================================================
// Where Function
// ============================================================================

export const where = <T>(builder: (p: PathProxy<T>) => WhereNode[]): Predicate<T> => {
  const p = createPathProxy<T>()
  const result = builder(p)

  if (result.length === 0) {
    return {
      _tag: 'Predicate',
      _entity: undefined as T,
      ast: { _tag: 'And', nodes: [] },
    }
  }

  if (result.length === 1) {
    return {
      _tag: 'Predicate',
      _entity: undefined as T,
      ast: result[0],
    }
  }

  return {
    _tag: 'Predicate',
    _entity: undefined as T,
    ast: andNode(result),
  }
}

// ============================================================================
// Operator Exports (Applicative Style)
// ============================================================================

// Equality operators
export const eq = <T>(path: PathProxy<T>, value: unknown): WhereNode => eqOp(path, value)
export const ne = <T>(path: PathProxy<T>, value: unknown): WhereNode => neOp(path, value)

// Comparison operators
export const gt = <T>(path: PathProxy<T>, value: unknown): WhereNode => gtOp(path, value)
export const gte = <T>(path: PathProxy<T>, value: unknown): WhereNode => gteOp(path, value)
export const lt = <T>(path: PathProxy<T>, value: unknown): WhereNode => ltOp(path, value)
export const lte = <T>(path: PathProxy<T>, value: unknown): WhereNode => lteOp(path, value)

// Range operators
export const between = <T>(path: PathProxy<T>, min: unknown, max: unknown): WhereNode =>
  betweenOp(path, min, max)

// Array membership operators
export const inList = <T>(path: PathProxy<T>, values: unknown[]): WhereNode => inOpFn(path, values)
export const notInList = <T>(path: PathProxy<T>, values: unknown[]): WhereNode => notInOp(path, values)

// Null checks
export const isNull = <T>(path: PathProxy<T>): WhereNode => isNullOp(path)
export const isNotNull = <T>(path: PathProxy<T>): WhereNode => isNotNullOp(path)

// String operators
export const like = <T>(path: PathProxy<T>, value: string): WhereNode => likeOp(path, value)
export const contains = <T>(path: PathProxy<T>, value: string): WhereNode => containsOp(path, value)
export const startsWith = <T>(path: PathProxy<T>, value: string): WhereNode => startsWithOp(path, value)
export const endsWith = <T>(path: PathProxy<T>, value: string): WhereNode => endsWithOp(path, value)
export const regex = <T>(path: PathProxy<T>, value: string): WhereNode => regexOp(path, value)

// Array operators
export const has = <T>(path: PathProxy<T>, value: unknown): WhereNode => hasOp(path, value)
export const hasAny = <T>(path: PathProxy<T>, values: unknown[]): WhereNode => hasAnyOp(path, values)
export const overlaps = <T>(path: PathProxy<T>, values: unknown[]): WhereNode => overlapsOp(path, values)

// ============================================================================
// Logical Combinators
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
