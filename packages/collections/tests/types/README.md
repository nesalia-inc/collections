# Compile-Time Type Tests

This directory contains **compile-time type tests** that verify the correctness of TypeScript types in the collections library.

## How They Work

These tests use `@deessejs/type-testing`'s `check<>()` function to perform type-level assertions. If a type assertion is wrong, the TypeScript compiler will report an error at compile time. At runtime, `check<>()` does nothing (it's essentially a no-op).

## Test Organization

- `index.test.ts` - Re-exports from other test files and documents organization
- `infer-field-types.test.ts` - Tests for `InferFieldTypes<T>`
- `infer-create-type.test.ts` - Tests for `InferCreateType<T>`
- `get-collection-type.test.ts` - Tests for `GetCollectionType<T>`
- `db-access-types.test.ts` - Tests for `DbAccess<TCollections>`
- `field-requirement.test.ts` - Tests for required vs optional field handling
- `select-field-types.test.ts` - Tests for select field union types

## Running Tests

Since these are compile-time tests, they will be verified automatically when you run:

- `pnpm typecheck` - TypeScript compilation check
- `pnpm lint` - ESLint check
- `pnpm test` - Runtime tests (Vitest will pick up these files but they have no runtime assertions)

## Philosophy

Type tests in this directory follow the principle that **type errors should be caught at compile time, not runtime**. If the types are correct, the code compiles. If the types are wrong, the compiler tells you exactly what's wrong.