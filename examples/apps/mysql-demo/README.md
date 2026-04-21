# MySQL Demo Example

A demonstration of `@deessejs/collections` with MySQL database.

## Features

This example showcases:

- **MySQL Connection**: Using `mysql()` helper for MySQL connections
- **Database Setup**: Proper MySQL connection with mysql2 driver
- **createCollections() Pattern**: Using the collection factory with MySQL adapter
- **Schema Sync**: Using `db.$push()` to sync schema to database
- **CRUD Operations**: Create, read, update, delete with type-safe queries

## Prerequisites

- Node.js 20+
- pnpm 9+
- MySQL server (running on localhost:3306 by default)

## MySQL Setup

### 1. Create the database

Connect to MySQL and create the test database:

```sql
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE IF NOT EXISTS test;
```

### 2. Configure connection (optional)

The demo uses default connection settings:
- Host: localhost
- Port: 3306
- User: root
- Password: (empty)
- Database: test

You can customize these via environment variables:

```bash
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=your_password
export MYSQL_DATABASE=test
```

Or use a connection string:

```typescript
const connectionString = 'mysql://user:pass@localhost:3306/mydb'
```

## Getting Started

1. **Install dependencies** from the repository root:

```bash
pnpm install
```

2. **Run the example**:

```bash
cd examples/apps/mysql-demo
pnpm dev
```

Or from the repository root:

```bash
pnpm --filter @deessejs/examples-mysql-demo dev
```

## Project Structure

```
mysql-demo/
├── package.json       # Package configuration with mysql2 dependency
├── tsconfig.json      # TypeScript configuration
├── README.md          # This file
└── src/
    └── index.ts       # Main entry point with MySQL demo
```

## Key Concepts Demonstrated

### MySQL Connection Setup

```typescript
import { createCollections, mysql } from '@deessejs/collections'

// Using connection string
const connectionString = 'mysql://user:pass@localhost:3306/mydb'
const { db } = createCollections({
  collections: [users],
  db: mysql(connectionString),
})
```

### Collection Definition

```typescript
export const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    email: field({ fieldType: f.text(), required: true }),
    active: field({ fieldType: f.boolean(), defaultValue: true }),
  },
  hooks: {
    beforeCreate: async (ctx) => { /* ... */ },
    afterCreate: async (ctx) => { /* ... */ },
  },
})
```

### Schema Sync with $push

```typescript
// Push schema to create tables
await db.$push()

// Now queries will work
const users = await db.users.findMany()
```

### Type-safe Queries

```typescript
import { where, eq } from '@deessejs/collections'

// Find active users
const activeUsers = await db.users.findMany({
  where: where((p) => [eq(p.active, true)]),
})

// Find by ID
const user = await db.users.findUnique({
  where: where((p) => [eq(p.id, 'user-123')]),
})
```

### CRUD Operations

```typescript
// Create
const user = await db.users.create({
  data: { name: 'Alice', email: 'alice@example.com' },
})

// Read
const allUsers = await db.users.findMany()
const activeUsers = await db.users.findMany({
  where: where((p) => [eq(p.active, true)]),
})

// Update
const updated = await db.users.update({
  where: where((p) => [eq(p.id, user.id)]),
  data: { bio: 'New bio' },
})

// Delete
await db.users.delete({
  where: where((p) => [eq(p.id, user.id)]),
})
```

## MySQL-Specific Notes

- **VARCHAR length**: MySQL requires length for VARCHAR columns. The adapter defaults to 255 if not specified.
- **BOOLEAN**: MySQL supports BOOLEAN type natively (mapped to TINYINT(1)).
- **JSON**: MySQL has native JSON type support.
- **UUID**: MySQL has no native UUID type. UUIDs are stored as VARCHAR(36).
- **TIMESTAMP**: MySQL TIMESTAMP does not have timezone support. Use DATETIME for timezone-aware data.

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

Make sure MySQL is running and accessible at the specified host and port.

### Access Denied

```
Error: Access denied for user 'root'@'localhost'
```

Check your username and password. Update environment variables or connection string.

### Database Not Found

```
Error: Unknown database 'test'
```

Create the database first:

```sql
CREATE DATABASE IF NOT EXISTS test;
```

## See Also

- [PostgreSQL Example](../todos-basic/) - Using PostgreSQL with collections
- [SQLite Example](../todos-basic/) - Using SQLite with collections
- [@deessejs/collections Documentation](../../packages/collections/)