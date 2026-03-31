// Where Type - Type-safe filtering system

// ============================================================================
// Operator Names
// ============================================================================

export const OPERATOR_NAMES = [
  'eq', 'ne', 'gt', 'gte', 'lt', 'lte',
  'in', 'notIn', 'between',
  'like', 'contains', 'startsWith', 'endsWith', 'regex',
  'isNull', 'isNotNull',
  'has', 'hasAny', 'overlaps',
] as const

export type OperatorName = typeof OPERATOR_NAMES[number]

// ============================================================================
// Operator Types - Type-Specific
// ============================================================================

export interface BaseOperators<V> {
  eq: (value: V | null) => WhereNode
  ne: (value: V | null) => WhereNode
  in: (values: V[]) => WhereNode
  notIn: (values: V[]) => WhereNode
  isNull: () => WhereNode
  isNotNull: () => WhereNode
}

export interface ScalarOperators<V> extends BaseOperators<V> {
  gt: (value: V) => WhereNode
  gte: (value: V) => WhereNode
  lt: (value: V) => WhereNode
  lte: (value: V) => WhereNode
  between: (min: V, max: V) => WhereNode
}

export interface StringOperators<V extends string> extends ScalarOperators<V> {
  like: (value: string) => WhereNode
  contains: (value: string) => WhereNode
  startsWith: (value: string) => WhereNode
  endsWith: (value: string) => WhereNode
  regex: (value: string) => WhereNode
}

export interface ArrayOperators<V extends unknown[]> extends BaseOperators<V> {
  has: (value: V[number]) => WhereNode
  hasAny: (value: V[number][]) => WhereNode
  overlaps: (value: V) => WhereNode
}

// Choose operators based on type
export type FieldOperators<T> =
  T extends string ? StringOperators<T> :
  T extends number | bigint ? ScalarOperators<T> :
  T extends Date ? ScalarOperators<T> :
  T extends unknown[] ? ArrayOperators<T> :
  BaseOperators<T>

// ============================================================================
// AST Node Types
// ============================================================================

export type WhereNode =
  | { readonly _tag: 'Eq'; readonly field: string; readonly value: unknown }
  | { readonly _tag: 'Ne'; readonly field: string; readonly value: unknown }
  | { readonly _tag: 'Gt'; readonly field: string; readonly value: unknown }
  | { readonly _tag: 'Gte'; readonly field: string; readonly value: unknown }
  | { readonly _tag: 'Lt'; readonly field: string; readonly value: unknown }
  | { readonly _tag: 'Lte'; readonly field: string; readonly value: unknown }
  | { readonly _tag: 'Like'; readonly field: string; readonly value: string }
  | { readonly _tag: 'Contains'; readonly field: string; readonly value: string }
  | { readonly _tag: 'StartsWith'; readonly field: string; readonly value: string }
  | { readonly _tag: 'EndsWith'; readonly field: string; readonly value: string }
  | { readonly _tag: 'Regex'; readonly field: string; readonly value: string }
  | { readonly _tag: 'In'; readonly field: string; readonly value: unknown[] }
  | { readonly _tag: 'NotIn'; readonly field: string; readonly value: unknown[] }
  | { readonly _tag: 'Between'; readonly field: string; readonly value: [unknown, unknown] }
  | { readonly _tag: 'IsNull'; readonly field: string }
  | { readonly _tag: 'IsNotNull'; readonly field: string }
  | { readonly _tag: 'Has'; readonly field: string; readonly value: unknown }
  | { readonly _tag: 'HasAny'; readonly field: string; readonly value: unknown[] }
  | { readonly _tag: 'Overlaps'; readonly field: string; readonly value: unknown[] }
  | { readonly _tag: 'And'; readonly nodes: WhereNode[] }
  | { readonly _tag: 'Or'; readonly nodes: WhereNode[] }
  | { readonly _tag: 'Not'; readonly node: WhereNode }
  | { readonly _tag: 'Search'; readonly fields: string[]; readonly value: string }
  | { readonly _tag: 'Field'; readonly path: string[] }

// Predicate wrapper
export type Predicate<T> = {
  readonly _tag: 'Predicate'
  readonly _entity: T
  readonly ast: WhereNode
}

// Accepts Predicate or raw WhereNode
export type PredicateInput<T> = Predicate<T> | WhereNode

// ============================================================================
// Object Approach Types
// ============================================================================

export interface StringOperator {
  eq?: string | null
  ne?: string | null
  in?: string[]
  notIn?: string[]
  like?: string
  contains?: string
  startsWith?: string
  endsWith?: string
  regex?: string
  mode?: 'default' | 'insensitive'
}

export interface NumberOperator {
  eq?: number | null
  ne?: number | null
  in?: number[]
  notIn?: number[]
  gt?: number
  gte?: number
  lt?: number
  lte?: number
  between?: [number, number]
}

export interface DateOperator {
  eq?: Date | string | null
  ne?: Date | string | null
  gt?: Date | string
  gte?: Date | string
  lt?: Date | string
  lte?: Date | string
  between?: [Date | string, Date | string]
}

export interface ArrayOperator<T extends unknown[]> {
  contains?: T[number]
  has?: T[number]
  hasAny?: T[number][]
  containsAny?: T[number][]
  overlaps?: T
}

export interface NullOperator {
  isNull?: boolean
  isNotNull?: boolean
}

export interface LogicalOperators<T> {
  AND?: T[]
  OR?: T[]
  NOT?: T
}

// Value types for where (Object approach)
export type WhereValue<T> =
  | T
  | (T extends string ? StringOperator : never)
  | (T extends number ? NumberOperator : never)
  | (T extends Date ? DateOperator : never)
  | (T extends unknown[] ? ArrayOperator<T> : never)
  | NullOperator

// Main Where type (Object approach)
export type Where<T = unknown> = {
  [K in keyof T]?: WhereValue<T[K]>
} & LogicalOperators<Where<T>> & { _search?: string | string[] }

// Logical combinators
export type LogicalCombinator = 'AND' | 'OR' | 'NOT'
