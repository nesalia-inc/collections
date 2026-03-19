# Database

Documentation about database configuration and adapters in Collections.

## Documents

- [Connections](./connections.md) - Database adapters (PostgreSQL, SQLite)
- [Auth Adapter](./auth-adapter.md) - How Collections bridges Better-Auth with Drizzle

## Overview

Collections supports multiple database providers through adapters:

```typescript
// PostgreSQL
import { pgAdapter } from '@deessejs/collections'

// SQLite
import { sqliteAdapter } from '@deessejs/collections'
```

Each adapter provides:
- Connection management
- Query execution
- Schema generation
- Migration support