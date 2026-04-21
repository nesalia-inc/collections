# WhereNode to Drizzle Converter

## Complete Operator List

The actual operators in the codebase are:
- Comparison: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`
- Range: `between`
- List: `inList`, `notInList`
- Null: `isNull`, `isNotNull`
- String: `like`, `contains`, `startsWith`, `endsWith`, `regex`
- Array: `has`, `hasAny`, `overlaps`
- Logical: `and`, `or`, `not`
- Full-text: `search`

## Implementation

```typescript
// src/adapter/queries/whereToDrizzle.ts

import {
  eq, ne, gt, gte, lt, lte, inArray, like, and, or, not, isNull, isNotNull,
  between, sql, SQL
} from 'drizzle-orm'
import type { WhereNode, Predicate } from '../../operations/where'
import type { AnyTable } from 'drizzle-orm'

// Validate field name against table to prevent SQL injection
const getColumn = (table: Record<string, unknown>, field: string) => {
  if (!(field in table)) {
    throw new Error(`Invalid field: ${field}`)
  }
  return table[field]
}

export const whereToDrizzle = <T extends Record<string, unknown>>(
  predicate: Predicate<T>,
  table: AnyTable
): SQL => {
  const ast = predicate.ast

  switch (ast._tag) {
    // Comparison operators
    case 'Eq':
      return eq(getColumn(table, ast.field), ast.value)
    case 'Ne':
      return ne(getColumn(table, ast.field), ast.value)
    case 'Gt':
      return gt(getColumn(table, ast.field), ast.value)
    case 'Gte':
      return gte(getColumn(table, ast.field), ast.value)
    case 'Lt':
      return lt(getColumn(table, ast.field), ast.value)
    case 'Lte':
      return lte(getColumn(table, ast.field), ast.value)

    // Range operator
    case 'Between':
      return between(
        getColumn(table, ast.field),
        ast.value[0],
        ast.value[1]
      )

    // List operators
    case 'In':
      return inArray(getColumn(table, ast.field), ast.value)
    case 'NotIn':
      return not(inArray(getColumn(table, ast.field), ast.value))

    // Null checks
    case 'IsNull':
      return isNull(getColumn(table, ast.field))
    case 'IsNotNull':
      return isNotNull(getColumn(table, ast.field))

    // String operators
    case 'Like':
      return like(getColumn(table, ast.field), ast.value)
    case 'Contains':
      return like(getColumn(table, ast.field), `%${ast.value}%`)
    case 'StartsWith':
      return like(getColumn(table, ast.field), `${ast.value}%`)
    case 'EndsWith':
      return like(getColumn(table, ast.field), `%${ast.value}`)
    case 'Regex':
      // PostgreSQL-specific regex via raw SQL
      return sql`${getColumn(table, ast.field)} ~ ${ast.value}`

    // Array operators (PostgreSQL)
    case 'Has':
      return sql`${getColumn(table, ast.field)} @> ${ast.value}`
    case 'HasAny':
      return sql`${getColumn(table, ast.field)} && ${ast.value}`
    case 'Overlaps':
      return sql`${getColumn(table, ast.field)} && ${ast.value}`

    // Full-text search (PostgreSQL with 'simple' text search config)
    case 'Search':
      return sql`to_tsvector('simple', ${getColumn(table, ast.fields[0])}) @@ plainto_tsquery('simple', ${ast.value})`

    // Logical operators
    case 'And':
      return and(...ast.nodes.map(n => whereToDrizzle({ ...predicate, ast: n }, table)))!
    case 'Or':
      return or(...ast.nodes.map(n => whereToDrizzle({ ...predicate, ast: n }, table)))!
    case 'Not':
      return not(whereToDrizzle({ ...predicate, ast: ast.node }, table))

    default:
      throw new Error(`Unknown WhereNode tag: ${(ast as any)._tag}`)
  }
}
```

## Operator Summary

| WhereNode Tag | Drizzle Equivalent | Dialect |
|---------------|-------------------|---------|
| `Eq` | `eq()` | Both |
| `Ne` | `ne()` | Both |
| `Gt` | `gt()` | Both |
| `Gte` | `gte()` | Both |
| `Lt` | `lt()` | Both |
| `Lte` | `lte()` | Both |
| `Between` | `between()` | Both |
| `In` | `inArray()` | Both |
| `NotIn` | `not(inArray())` | Both |
| `IsNull` | `isNull()` | Both |
| `IsNotNull` | `isNotNull()` | Both |
| `Like` | `like()` | Both |
| `Contains` | `like(val, '%x%')` | Both |
| `StartsWith` | `like(val, 'x%')` | Both |
| `EndsWith` | `like(val, '%x')` | Both |
| `Regex` | `~` (regex match) | PostgreSQL |
| `Search` | `to_tsvector/plainto_tsquery('simple')` | PostgreSQL |
| `Overlaps` | `&&` (array overlap) | PostgreSQL |
| `Has` | `@>` (array contains) | PostgreSQL |
| `HasAny` | `&&` (array overlap) | PostgreSQL |
| `And` | `and()` | Both |
| `Or` | `or()` | Both |
| `Not` | `not()` | Both |

## Dialect Notes

- `Regex`, `Search`, `Has`, `HasAny`, `Overlaps` are PostgreSQL-specific
- `Search` uses `'simple'` text search configuration (works on both PostgreSQL and SQLite but is optimized for PostgreSQL)
- For SQLite regex, consider using GLOB or custom SQL
