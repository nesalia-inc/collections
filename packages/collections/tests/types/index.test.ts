// Compile-time type tests - organized by type utility
// These tests use @deessejs/type-testing's check<>() for compile-time type verification

// Re-export all type tests for easy importing
export * from './infer-field-types.test'
export * from './infer-create-type.test'
export * from './get-collection-type.test'
export * from './db-access-types.test'
export * from './field-requirement.test'
export * from './select-field-types.test'

/**
 * Type Test Organization
 *
 * This module re-exports all compile-time type tests. Each test file focuses on
 * a specific type utility:
 *
 * - InferFieldTypes: Extract field value types from Field<T> records
 * - InferCreateType: Determine create input types (respecting required/defaultValue)
 * - GetCollectionType: Extract collection read types (required vs optional)
 * - DbAccess: Type-safe database access object construction
 * - FieldRequirement: Required vs optional handling for create and read
 * - SelectFieldTypes: Union type generation for select field projections
 *
 * All tests use check<>() which performs compile-time type equality checks.
 * If types are incorrect, the TypeScript compiler will report an error.
 */