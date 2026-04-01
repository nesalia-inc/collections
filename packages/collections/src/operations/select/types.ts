// Select Types - Type-safe field selection with AST

import type { PathSegment, PathProxy } from '../path'

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Unwrap PathProxy to get the underlying type
 * PathProxy<number> -> number
 * PathProxy<string> -> string
 */
export type Unwrap<T> = T extends PathProxy<infer V>
  ? V
  : T extends object
    ? { [K in keyof T]: Unwrap<T[K]> }
    : T

// ============================================================================
// Select Node - Single field selection with path information
// ============================================================================

export interface SelectNode {
  readonly _tag: 'SelectNode'
  readonly path: string[]       // ex: ['author', 'profile', 'name']
  readonly field: string       // Flat field name: 'author.profile.name'
  readonly alias?: string      // Alias if different from field (from object key)
  readonly isRelation: boolean // Indicates if path traverses a relation
  readonly isCollection: boolean // Indicates if path traverses an array (1:N)
}

// ============================================================================
// Selection - Builder result wrapper with phantom types
// ============================================================================

export interface Selection<TEntity, TResult> {
  readonly _tag: 'Selection'
  readonly _entity?: TEntity
  readonly _result?: Unwrap<TResult> // Unwrapped result type
  readonly ast: SelectNode[]
}

/**
 * Type utility to extract the result type from a Selection
 */
export type InferSelection<T> = T extends Selection<unknown, infer R> ? R : never

/**
 * Convert PathSegment[] to string[] for SelectNode
 */
export type PathToStringArray<T extends PathSegment[]> = {
  [K in keyof T]: T[K] extends string ? T[K] : never
}
