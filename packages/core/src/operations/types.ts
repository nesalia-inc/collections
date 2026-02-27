/**
 * Where condition operators
 */
export type WhereOperator<T> =
  | { eq: T }
  | { neq: T }
  | { gt: T }
  | { gte: T }
  | { lt: T }
  | { lte: T }
  | { in: T[] }
  | { notIn: T[] }
  | { contains: T }
  | { startsWith: T }
  | { endsWith: T }
  | { isNull: boolean }
  | { not: T }

/**
 * Where condition value
 */
export type WhereValue<T> = T | WhereOperator<T>

/**
 * Where conditions
 */
export type WhereConditions = Record<string, unknown>

/**
 * Order by direction
 */
export type OrderByDirection = 'asc' | 'desc'

/**
 * Order by clause
 */
export type OrderByClause = Record<string, OrderByDirection>

/**
 * Select clause - fields to return
 */
export type SelectClause = Record<string, boolean>

/**
 * Find many options
 */
export type FindManyOptions = {
  where?: WhereConditions
  orderBy?: OrderByClause | OrderByClause[]
  limit?: number
  offset?: number
  select?: SelectClause
}

/**
 * Find unique options
 */
export type FindUniqueOptions = {
  where: WhereConditions
  select?: SelectClause
}

/**
 * Find first options
 */
export type FindFirstOptions = {
  where: WhereConditions
  orderBy?: OrderByClause | OrderByClause[]
  select?: SelectClause
}

/**
 * Create options
 */
export type CreateOptions<T> = {
  data: T
  returning?: boolean
}

/**
 * Create many options
 */
export type CreateManyOptions<T> = {
  data: T[]
}

/**
 * Update options
 */
export type UpdateOptions<T> = {
  where: WhereConditions
  data: T
  returning?: boolean
}

/**
 * Update many options
 */
export type UpdateManyOptions<T> = {
  where: WhereConditions
  data: T
}

/**
 * Delete options
 */
export type DeleteOptions = {
  where: WhereConditions
  returning?: boolean
}

/**
 * Delete many options
 */
export type DeleteManyOptions = {
  where: WhereConditions
}

/**
 * Count options
 */
export type CountOptions = {
  where?: WhereConditions
}

/**
 * Exists options
 */
export type ExistsOptions = {
  where: WhereConditions
}
