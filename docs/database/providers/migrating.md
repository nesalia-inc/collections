# Migrating Between Providers

Since collections provides a unified DSL, migrating between databases is straightforward.

## How to Migrate

1. **Change the adapter** in your config
2. **Update connection string**
3. **Run migrations** (Drizzle handles the rest)

```typescript
// Before: PostgreSQL
export const config = defineConfig({
  database: pgAdapter({ url: process.env.POSTGRES_URL }),
  collections: [posts]
})

// After: MySQL (just change the adapter)
export const config = defineConfig({
  database: mysqlAdapter({ url: process.env.MYSQL_URL }),
  collections: [posts]
})
```

## Considerations

### Data Type Differences

Some features behave differently across providers:

| Feature | PostgreSQL | MySQL | SQLite |
|---------|------------|-------|--------|
| Native UUID | ✓ | ✗ (varchar) | ✗ (text) |
| Native JSON | ✓ (jsonb) | ✓ | ✗ (text) |
| Array types | ✓ | ✗ (JSON) | ✗ (JSON) |
| Full-text search | ✓ | ✓ | Limited |
| Time zones | ✓ | ✗ | N/A |

### Migration Strategy

1. **Export data** from current database
2. **Update adapter** in your config
3. **Run migrations** to create schema
4. **Import data** (handle type conversions if needed)

### Best Practices

- Test thoroughly in staging before production
- Keep provider-specific code minimal
- Use the escape hatch (`pg:`, `mysql:`) only when necessary
- Consider data loss for types not supported by target provider
