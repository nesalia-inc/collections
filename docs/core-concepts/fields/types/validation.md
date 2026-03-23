# Validation vs Database Constraints

Field options like `minLength`, `maxLength`, `min`, `max` serve double duty:

1. **Application-level validation** - Enforced by Zod when data is submitted
2. **Database constraints** - Applied to the column schema (e.g., VARCHAR(100))

This ensures data integrity both in your application and directly in the database.

```typescript
// This field will:
// - Validate max 100 chars in JS
// - Create VARCHAR(100) column in SQL
const title = field({
  fieldType: f.text({ maxLength: 100 })
})
```
