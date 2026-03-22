# Database Connections

Configure database connections for your Collections application.

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

PostgreSQL uses connection pooling by default:

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

For testing:

```typescript
const config = defineConfig({
  database: sqliteAdapter({
    url: ':memory:'
  })
})
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `url` | string | Connection string |
| `debug` | boolean | Log SQL queries |

### PostgreSQL

| Option | Type | Description |
|--------|------|-------------|
| `max` | number | Max connections |
| `idleTimeoutMs` | number | Idle timeout |
| `connectTimeoutMs` | number | Connection timeout |

### SQLite

| Option | Type | Description |
|--------|------|-------------|
| `mode` | 'readwrite' | Database mode |

## Multiple Databases

Multi-tenant applications:

```typescript
const config = defineConfig({
  database: {
    default: pgAdapter({ url: process.env.DEFAULT_DB! }),
    logs: pgAdapter({ url: process.env.LOGS_DB! })
  },
  collections: [posts, logs]
})
```

## Environment Variables

```bash
# .env
DATABASE_URL=postgres://user:pass@localhost:5432/db
```

For more configuration options, see [Config Database](../config/database.md).