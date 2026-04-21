# PostgreSQL Demo

This example demonstrates how to use `@deessejs/collections` with a PostgreSQL database adapter.

## Prerequisites

- Node.js 18+ (or 16+ with ESNext support)
- PostgreSQL 12+ running and accessible
- `pg` driver for Node.js

## Environment Variables

**Important:** Copy `.env.example` to `.env` and configure your database connection.

Configure your PostgreSQL connection using environment variables or a full connection URL:

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_HOST` | PostgreSQL server hostname | `localhost` |
| `POSTGRES_PORT` | PostgreSQL server port | `5432` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `POSTGRES_DB` | Database name | `postgres` |

### Example .env file

```env
# Full connection URL (recommended for cloud databases like Neon, Supabase, etc.)
POSTGRES_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Or individual parameters
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
POSTGRES_DB=mydb
```

**Note:** For cloud PostgreSQL providers (Neon, Supabase, Railway, etc.), always use `sslmode=require` in your connection URL.

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up your PostgreSQL database and configure environment variables

3. Run the demo:
   ```bash
   pnpm dev
   ```

## What This Demo Shows

### 1. PostgreSQL Connection Setup

```typescript
import { Pool } from 'pg'
import { postgres, createCollections } from '@deessejs/collections'

const pool = new Pool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
})
```

### 2. Using postgres() Pattern with createCollections()

```typescript
const result = createCollections({
  collections: [users, posts],
  db: postgres(pool),
})
```

The `postgres()` function wraps the pg Pool and tells `createCollections()` to use the PostgreSQL adapter.

### 3. Syncing Schema with db.$push()

```typescript
// After creating collections, push the schema to create tables
await db.$push()
```

`db.$push()` uses drizzle-kit to push the schema to your PostgreSQL database, creating any missing tables and columns without deleting data.

### 4. CRUD Operations

```typescript
// Create
const user = await db.users.create({
  data: { name: 'Alice', email: 'alice@example.com' }
})

// Read
const allUsers = await db.users.findMany()
const user = await db.users.findUnique({ ... })

// Update
await db.users.update({ data: { active: false } })

// Count
const count = await db.users.count()
```

## Collection Definitions

This demo includes two collections:

### Users Collection
- `name` - Required text field (1-100 chars)
- `email` - Required email field with validation
- `bio` - Optional text field (max 500 chars)
- `active` - Boolean with default value `true`

### Posts Collection
- `title` - Required text field (1-200 chars)
- `content` - Optional text field
- `published` - Boolean with default value `false`
- `viewCount` - Number with default value `0`

## Notes

- This demo uses the `pg` driver directly for the connection pool
- The `createCollections()` function handles Drizzle schema generation internally
- Each collection gets a `$push()` method on the db object to sync schema changes
- The PostgreSQL adapter uses Drizzle ORM's `node-postgres` integration
