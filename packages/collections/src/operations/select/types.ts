// Select Types - Type-safe field selection with AST

import type { PathSegment } from '../path'

// ============================================================================
// Select Node - Single field selection with path information
// ============================================================================

export interface SelectNode {
  readonly _tag: 'SelectNode'
  readonly path: string[]       // ex: ['author', 'profile', 'name']
  readonly field: string        // Flat field name: 'author.profile.name'
  readonly alias?: string       // Alias if different from field (for nested paths)
  readonly isRelation: boolean  // Indicates if path traverses a relation
  readonly isCollection: boolean // Indicates if path traverses an array (1:N)
}

// ============================================================================
// Selection - Builder result wrapper with phantom types
// ============================================================================

export interface Selection<TEntity, TResult> {
  readonly _tag: 'Selection'
  readonly _entity?: TEntity
  readonly _result?: TResult // Phantom type for inference
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
