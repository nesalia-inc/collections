# Database

Documentation about database configuration and providers in Collections.

## Documents

- [Connections](./connections.md) - Database adapters (PostgreSQL, SQLite)
- [Providers](../providers.md) - Custom provider creation with `databaseProvider`
- [Auth Adapter](./auth-adapter.md) - How Collections bridges Better-Auth with Drizzle

## Overview

Collections provides a **100% dynamic database provider system**. The built-in adapters (PostgreSQL, SQLite) are just implementations of a standard interface. You can create custom providers for any database or data source.

### Built-in Providers

```typescript
// PostgreSQL
import { pgAdapter } from '@deessejs/collections'

// SQLite
import { sqliteAdapter } from '@deessejs/collections'
```

### Custom Providers

Create your own provider using `databaseProvider`:

```typescript
import { databaseProvider } from '@deessejs/collections'

// Custom MySQL provider
const mysqlProvider = databaseProvider({
  name: 'mysql',
  connect: async (config) => { /* ... */ },
  query: async (sql, params) => { /* ... */ },
  // ... implement all methods
})
```

Each provider provides:
- Connection management
- Query execution
- Schema generation
- Migration support

## Why Dynamic Providers?

The dynamic provider system allows:

- **Any database** - PostgreSQL, MySQL, SQLite, CockroachDB, etc.
- **Any data source** - REST APIs, GraphQL, files, in-memory
- **Testing** - Easy to mock providers
- **Extensibility** - Add new databases without modifying core

See [Providers](./providers.md) for detailed documentation on creating custom providers.