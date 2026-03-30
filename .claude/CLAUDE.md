# Project Instructions

@import .claude/rules/architecture.md

## Pre-Merge Requirements

Before any PR is merged, the following must pass:

1. `pnpm typecheck` — no TypeScript errors
2. `pnpm lint` — no ESLint errors
3. `pnpm test` — all tests pass
4. Coverage gate (`fail_ci_if_error: true`) — coverage must not decrease

## Commit Conventions

Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`

When committing AI-authored changes:
```
Co-Authored-By: martyy-code <nesalia.inc@gmail.com>
```
