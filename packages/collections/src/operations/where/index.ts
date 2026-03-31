export type {
  Where,
  WhereValue,
  WhereNode,
  Predicate,
  PredicateInput,
  StringOperator,
  NumberOperator,
  DateOperator,
  ArrayOperator,
  NullOperator,
  LogicalOperators,
} from './types'

export { where, and, or, not, search } from './builder'

// Re-export operators for convenience
export { eq, ne, gt, gte, lt, lte } from './builder'
export { between, inList, notInList } from './builder'
export { isNull, isNotNull } from './builder'
export { like, contains, startsWith, endsWith, regex } from './builder'
export { has, hasAny, overlaps } from './builder'
