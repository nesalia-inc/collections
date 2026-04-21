# Security Considerations

## SQL Injection Prevention

**CRITICAL**: Always validate field names against table schema before using them in queries.

```typescript
// src/adapter/queries/whereToDrizzle.ts

// ALWAYS validate field names against table schema
const getColumn = (table: Record<string, unknown>, field: string): unknown => {
  if (!(field in table)) {
    throw new Error(`Invalid field name: ${field}`)
  }
  return table[field]
}

// In whereToDrizzle:
case 'Eq':
  return eq(getColumn(table, ast.field), ast.value)
```

## Field Name Validation

The WhereNode AST contains `field` names that come from user input. These MUST be validated:

1. **WhereNode field names**: Validated via `getColumn()` before use
2. **OrderBy field names**: Validated in `orderByToDrizzle()`
3. **Select field names**: Validated via proxy in `selectToDrizzle()`

## Validation Example

```typescript
const getColumn = (table: Record<string, unknown>, field: string): unknown => {
  // Check if field exists in table schema
  if (!(field in table)) {
    throw new AdapterError(
      `Invalid field name: ${field}`,
      'INVALID_FIELD',
      { field, validFields: Object.keys(table) }
    )
  }
  return table[field]
}
```

## Note on PathProxy

In the actual codebase, field paths are validated via the PathProxy system:

```typescript
// PathProxy tracks field access and converts to path strings
// e.g., p.author.name becomes "author.name"

// The adapter receives already-constructed WhereNode AST
// with field names as strings, so validation is still required
```

## PostgreSQL-Specific Considerations

When using raw SQL for operators like `Overlaps`, `Has`, `Search`:

```typescript
// SAFE: Using parameterized queries
case 'Overlaps':
  return sql`${getColumn(table, ast.field)} && ${ast.value}`

// Drizzle's sql template automatically parameterizes values
// The column name is validated via getColumn()
```

## Best Practices

1. **Never concatenate user input into SQL strings** - Use parameterized queries
2. **Always use `getColumn()` helper** - Validates field names against schema
3. **Validate at the adapter boundary** - Field validation should happen in adapter code
4. **Throw on invalid fields** - Don't silently ignore unknown fields
5. **Let Zod handle value validation** - Field schemas handle type coercion and validation
