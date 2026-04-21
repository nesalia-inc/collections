# Project Instructions

@import .claude/rules/architecture.md

## Pre-Merge Requirements

Before any PR is merged, the following must pass:

1. `pnpm typecheck` — no TypeScript errors
2. `pnpm lint` — no ESLint errors
3. `pnpm test` — all tests pass
4. Coverage gate (`fail_ci_if_error: true`) — coverage must not decrease

## @deessejs/fp Integration

This project uses `@deessejs/fp` for functional programming patterns. All new code MUST maximize the use of `@deessejs/fp` types and functions:

- Use `Result<T, E>` instead of throwing errors or returning null
- Use `Maybe<T>` instead of nullable returns
- Use `Try<T, E>` for wrapping synchronous code that might throw
- Use `AsyncResult<T, E>` for async operations with typed errors
- Use `error()` builder to create structured domain errors
- Use `Unit` instead of `undefined` or `void` in Result success types
- Use `isOk()`, `isErr()`, `isNone()`, `isSome()` for type guards
- Use `match()` for pattern matching on Result/Maybe
- Use `map()`, `flatMap()` for chaining operations

## Commit Conventions

Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

When committing AI-authored changes:
```
Co-Authored-By: martyy-code <nesalia.inc@gmail.com>
```
