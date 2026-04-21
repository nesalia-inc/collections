// SQL Builder - Converts AST types to Drizzle SQL expressions

import { and, or, not, eq, ne, gt, gte, lt, lte, like, ilike, inArray, notInArray, asc, desc, isNull, isNotNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'

import type { Predicate, WhereNode } from '../where/types'
import type { OrderBy, OrderNode } from '../order-by/types'
import type { Selection, SelectNode } from '../select/types'

// Type for drizzle table (using any to avoid import complexity)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDrizzleTable = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SelectFields = any

// ============================================================================
// Field Path Resolution
// ============================================================================

/**
 * Resolve a field path (e.g., 'author.name') to a table column reference.
 * For simple paths like 'published', returns table.columns.published.
 * For nested paths like 'author.name', traverses through relationships.
 * Supports Drizzle table structures with columns property.
 */
function resolveFieldPath(table: AnyDrizzleTable, fieldPath: string): AnyDrizzleTable {
  const parts = fieldPath.split('.')
  let current: unknown = table

  for (const part of parts) {
    if (current === undefined || current === null) {
      break
    }
    // Handle Drizzle table structure with columns
    if (current && typeof current === 'object' && 'columns' in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)['columns']
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current as AnyDrizzleTable
}

/**
 * Get column from table by field path, with fallback to direct property access
 * Returns undefined if the column cannot be resolved
 */
function getColumn(table: AnyDrizzleTable, fieldPath: string): AnyDrizzleTable | undefined {
  const column = resolveFieldPath(table, fieldPath)
  if (column !== undefined) {
    return column
  }
  // Fallback: try direct property access on table (for mock tables in tests)
  const directAccess = (table as Record<string, AnyDrizzleTable>)[fieldPath]
  if (directAccess !== undefined) {
    return directAccess
  }
  // Field path doesn't exist in table
  return undefined
}

// ============================================================================
// Where SQL Builder
// ============================================================================

/**
 * Convert a Predicate (or raw WhereNode) to Drizzle SQL expression
 */
function buildWhereNodeSQL(node: WhereNode, table: AnyDrizzleTable): SQL | undefined {
  switch (node._tag) {
    // Comparison operators
    case 'Eq': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return eq(col, node.value)
    }

    case 'Ne': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return ne(col, node.value)
    }

    case 'Gt': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return gt(col, node.value)
    }

    case 'Gte': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return gte(col, node.value)
    }

    case 'Lt': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return lt(col, node.value)
    }

    case 'Lte': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return lte(col, node.value)
    }

    // Like operators
    case 'Like': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return like(col, node.value)
    }

    case 'Contains': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return like(col, `%${node.value}%`)
    }

    case 'StartsWith': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return like(col, `${node.value}%`)
    }

    case 'EndsWith': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return like(col, `%${node.value}`)
    }

    case 'Regex': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      // Simplified: basic pattern matching. For proper regex, use raw SQL.
      return like(col, String(node.value))
    }

    // Array operators
    case 'In': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return inArray(col, node.value)
    }

    case 'NotIn': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return notInArray(col, node.value)
    }

    case 'Between': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      const [min, max] = node.value
      return and(
        gte(col, min),
        lte(col, max)
      )
    }

    // Null operators
    case 'IsNull': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return isNull(col)
    }

    case 'IsNotNull': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      return isNotNull(col)
    }

    // Array membership operators
    case 'Has': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      // Array contains - use sql `=` with array contains
      return eq(col, node.value)
    }

    case 'HasAny': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      // Check if array contains any of the values
      const conditions = node.value.map((v) => eq(col, v))
      return or(...conditions)
    }

    case 'Overlaps': {
      const col = getColumn(table, node.field)
      if (col === undefined) return undefined
      // Array overlaps - check intersection
      return inArray(col, node.value)
    }

    // Logical operators
    case 'And': {
      const conditions = node.nodes
        .map((n) => buildWhereNodeSQL(n, table))
        .filter((c): c is SQL => c !== undefined)
      if (conditions.length === 0) return undefined
      if (conditions.length === 1) return conditions[0]
      return and(...conditions)
    }

    case 'Or': {
      const conditions = node.nodes
        .map((n) => buildWhereNodeSQL(n, table))
        .filter((c): c is SQL => c !== undefined)
      if (conditions.length === 0) return undefined
      if (conditions.length === 1) return conditions[0]
      return or(...conditions)
    }

    case 'Not': {
      const condition = buildWhereNodeSQL(node.node, table)
      if (!condition) return undefined
      return not(condition)
    }

    // Search operator - searches across multiple fields
    case 'Search': {
      const conditions = node.fields.map((field) => {
        const col = getColumn(table, field)
        if (col === undefined) return undefined
        return ilike(col, `%${node.value}%`)
      }).filter((c): c is SQL => c !== undefined)
      if (conditions.length === 0) return undefined
      if (conditions.length === 1) return conditions[0]
      return or(...conditions)
    }

    default:
      // Exhaustive check - should never reach here
      return undefined
  }
}

/**
 * Convert Predicate AST to Drizzle where clause
 */
export function buildWhereSQL(predicate: Predicate<unknown>, table: AnyDrizzleTable): SQL | undefined {
  if (!predicate?.ast) return undefined
  return buildWhereNodeSQL(predicate.ast, table)
}

/**
 * Convert a Predicate to Drizzle SQL expression.
 * This is the main entry point for converting where predicates to SQL.
 *
 * @param predicate - The Predicate AST to convert
 * @param table - The Drizzle table to use for column references
 * @returns SQL expression or undefined if predicate is empty
 */
export function predicateToSql<T extends Record<string, unknown>>(
  predicate: Predicate<T>,
  table: AnyDrizzleTable
): SQL | undefined {
  return buildWhereSQL(predicate, table)
}

// ============================================================================
// OrderBy SQL Builder
// ============================================================================

/**
 * Convert OrderNode to Drizzle orderBy expression
 */
function buildOrderNodeSQL(node: OrderNode<unknown>, table: AnyDrizzleTable): SQL {
  const column = getColumn(table, node.field)
  if (!column) {
    throw new Error(`OrderBy field '${node.field}' not found in table`)
  }
  const direction = node.direction === 'desc' ? desc(column) : asc(column)
  return direction
}

/**
 * Convert OrderBy AST to Drizzle orderBy array
 */
export function buildOrderBySQL(orderBy: OrderBy<unknown>, table: AnyDrizzleTable): SQL[] {
  if (!orderBy?.ast || orderBy.ast.length === 0) return []
  return orderBy.ast.map((node) => buildOrderNodeSQL(node, table))
}

// ============================================================================
// Select SQL Builder
// ============================================================================

/**
 * Convert SelectNode to Drizzle select field
 * Returns an object with the field path and optional alias
 */
function buildSelectNodeSQL(node: SelectNode, table: AnyDrizzleTable): SelectFields {
  // Use the alias as the key and the table[field] as the value
  return { [node.alias]: table[node.field] }
}

/**
 * Convert Selection to Drizzle select fields
 */
export function buildSelectSQL(selection: Selection<unknown, unknown>, table: AnyDrizzleTable): SelectFields {
  if (!selection?.ast || selection.ast.length === 0) {
    // Return all fields if no selection specified
    return table
  }
  const result: SelectFields = {}
  for (const node of selection.ast) {
    const field = buildSelectNodeSQL(node, table)
    // Merge the field (alias: column)
    Object.assign(result, field)
  }
  return result
}
