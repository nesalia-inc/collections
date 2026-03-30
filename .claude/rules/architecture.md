# Architecture Rules

## Two-Layer Design

This project follows a strict two-layer architecture:

### Layer 1: `column-types/` (Internal Only - Low-Level Abstraction)

`@packages/collections/src/column-types/` is a **validated representation of SQL column types** for the `columnType` parameter of `fieldType`. It is:

- **Not fieldTypes** — they are at a **lower level of abstraction** than fieldTypes. They are not used directly by collections
- **Not for end-users** — this is an internal implementation detail
- **For internal developers** — building field types within this package
- **For plugin developers** — extending the library with custom field types

The `column-types/` layer wraps Drizzle ORM column types with additional validation and error handling using `@deessejs/core` (Result, Maybe, Try). It provides type-safe column definitions that `fieldType` consumes via `buildColumnType`.

### Layer 2: `fields/` (Public API - High-Level Abstraction)

`@packages/collections/src/fields/` exposes the public `fieldType`, `field`, and `f` API. FieldTypes are what collections use — they wrap column-types and add Zod validation, transforms, and options handling.

**Rule:** Never export `column-types/` directly in the package's public API (`src/index.ts`). The column-types layer is an implementation detail.
