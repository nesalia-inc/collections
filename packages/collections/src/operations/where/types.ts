// Where Type - Type-safe filtering system

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
