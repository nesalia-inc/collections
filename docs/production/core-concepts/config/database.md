# Database

Configure the database adapter for your collections.

## PostgreSQL

```typescript
import { pgAdapter } from '@deessejs/collections'

const config = defineConfig({
  database: pgAdapter({
    url: process.env.DATABASE_URL!
  })
})
```

### Connection Pool

PostgreSQL uses connection pooling by default. Configure pool settings:

```typescript
const config = defineConfig({
  database: pgAdapter({
    url: process.env.DATABASE_URL!,
    max: 20,           // Max connections
    idleTimeoutMs: 30000,
    connectTimeoutMs: 10000
  })
})
```

## SQLite

```typescript
import { sqliteAdapter } from '@deessejs/collections'

const config = defineConfig({
  database: sqliteAdapter({
    url: './data.db'
  })
})
```

### In-Memory

For testing, use in-memory SQLite:

```typescript
const config = defineConfig({
  database: sqliteAdapter({
    url: ':memory:'
  })
})
```

## Adapter Options

### Common Options

| Option | Type | Description |
|--------|------|-------------|
| `url` | string | Connection string |
| `debug` | boolean | Log SQL queries (dev only) |

### PostgreSQL Specific

| Option | Type | Description |
|--------|------|-------------|
| `max` | number | Max connections in pool |
| `idleTimeoutMs` | number | Idle connection timeout |
| `connectTimeoutMs` | number | Connection timeout |

### SQLite Specific

| Option | Type | Description |
|--------|------|-------------|
| `mode` | 'readwrite' | Database mode |
| `caption` | string | Database name |

## Multiple Databases

For multi-tenant applications:

```typescript
const config = defineConfig({
  database: {
    default: pgAdapter({ url: process.env.DEFAULT_DB! }),
    logs: pgAdapter({ url: process.env.LOGS_DB! })
  },
  collections: [posts, logs]
})

// Access different databases
config.db.posts.find()           // Uses default
config.db.logs.find()           // Uses logs
```