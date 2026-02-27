/**
 * Extract field names from a collection's fields
 */
export type CollectionFieldNames<T extends Record<string, { fieldType: { schema: unknown } }>> = keyof T

/**
 * Extract field schema type from a field definition
 */
export type FieldSchema<T extends { fieldType: { schema: unknown } }> = T['fieldType']['schema']

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
export type WhereConditions<T = Record<string, unknown>> = T

/**
 * Order by direction
 */
export type OrderByDirection = 'asc' | 'desc'

/**
 * Order by clause
 */
export type OrderByClause<T = Record<string, unknown>> = T

/**
 * Select clause - fields to return
 */
export type SelectClause<T = Record<string, unknown>> = Partial<Record<keyof T, boolean>>

/**
 * Find many options
 */
export type FindManyOptions<T = Record<string, unknown>> = {
  where?: WhereConditions<T>
  orderBy?: OrderByClause<T> | OrderByClause<T>[]
  limit?: number
  offset?: number
  select?: SelectClause<T>
}

/**
 * Find unique options
 */
export type FindUniqueOptions<T = Record<string, unknown>> = {
  where: WhereConditions<T>
  select?: SelectClause<T>
}

/**
 * Find first options
 */
export type FindFirstOptions<T = Record<string, unknown>> = {
  where: WhereConditions<T>
  orderBy?: OrderByClause<T> | OrderByClause<T>[]
  select?: SelectClause<T>
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
export type UpdateOptions<T, TFields = Record<string, unknown>> = {
  where: WhereConditions<TFields>
  data: Partial<T>
  returning?: boolean
}

/**
 * Update many options
 */
export type UpdateManyOptions<T, TFields = Record<string, unknown>> = {
  where: WhereConditions<TFields>
  data: Partial<T>
}

/**
 * Delete options
 */
export type DeleteOptions<TFields = Record<string, unknown>> = {
  where: WhereConditions<TFields>
  returning?: boolean
}

/**
 * Delete many options
 */
export type DeleteManyOptions<TFields = Record<string, unknown>> = {
  where: WhereConditions<TFields>
}

/**
 * Count options
 */
export type CountOptions<TFields = Record<string, unknown>> = {
  where?: WhereConditions<TFields>
}

/**
 * Exists options
 */
export type ExistsOptions<TFields = Record<string, unknown>> = {
  where: WhereConditions<TFields>
}
