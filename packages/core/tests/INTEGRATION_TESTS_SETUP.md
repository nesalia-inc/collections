# Integration Test Setup

To run the integration tests, you need to create a table in your Neon database:

```sql
CREATE TABLE IF NOT EXISTS test_users_hooks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

Or using Drizzle Kit:
```bash
npx drizzle-kit push
```

Then run tests with:
```bash
DATABASE_URL="your-neon-url" npx vitest run tests/hooks-integration.test.ts
```
