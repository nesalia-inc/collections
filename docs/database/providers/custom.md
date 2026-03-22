# Creating Custom Providers

Collections provides a **100% dynamic provider system**. You can create custom providers for any database or data source using `databaseProvider`:

```typescript
import { databaseProvider } from '@deessejs/collections'

const myProvider = databaseProvider({
  name: 'my-custom-db',

  // Connection
  connect: async (config) => {
    return {
      query: async (sql, params) => { /* ... */ },
      execute: async (sql, params) => { /* ... */ },
      transaction: async (fn) => { /* ... */ },
    }
  },

  // Schema generation
  createTable: (name, columns) => { /* ... */ },

  // Field type mapping
  types: {
    text: 'text',
    number: 'integer',
    boolean: 'boolean',
    json: 'text',
    uuid: 'varchar(36)',
    timestamp: 'timestamp'
  }
})
```

## Provider Interface

A custom provider must implement:

```typescript
interface DatabaseProvider {
  name: string

  // Connect to the database
  connect: (config: ProviderConfig) => Promise<DatabaseConnection>

  // Create a table definition
  createTable: (name: string, columns: ColumnDefinition[]) => TableDefinition

  // Map field types to database types
  types: Record<FieldKind, string>
}

interface DatabaseConnection {
  query: (sql: string, params?: unknown[]) => Promise<unknown[]>
  execute: (sql: string, params?: unknown[]) => Promise<number>
  transaction: <T>(fn: (tx: Transaction) => Promise<T>) => Promise<T>
}
```

## Example: Custom REST API Provider

```typescript
const restApiProvider = databaseProvider({
  name: 'rest-api',

  connect: async (config) => {
    const baseUrl = config.url

    return {
      query: async (sql, params) => {
        // Convert SQL-like query to REST call
        const response = await fetch(`${baseUrl}/query`, {
          method: 'POST',
          body: JSON.stringify({ sql, params })
        })
        return response.json()
      },

      execute: async (sql, params) => {
        const response = await fetch(`${baseUrl}/execute`, {
          method: 'POST',
          body: JSON.stringify({ sql, params })
        })
        return response.json()
      },

      transaction: async (fn) => {
        // Handle transaction logic
        return fn(mockTx)
      }
    }
  },

  createTable: (name, columns) => {
    return `CREATE TABLE ${name} (${columns.join(', ')})`
  },

  types: {
    text: 'text',
    number: 'numeric',
    boolean: 'boolean',
    json: 'json',
    uuid: 'uuid',
    timestamp: 'timestamptz'
  }
})
```

## Using Custom Providers

```typescript
const config = defineConfig({
  database: restApiProvider({
    url: 'https://api.example.com'
  }),
  collections: [posts, users]
})
```

## Why Custom Providers?

- **Legacy databases** - Connect to existing databases
- **APIs** - Use REST or GraphQL as data source
- **Testing** - Easy to mock with in-memory providers
- **Specialized backends** - Connect to search engines, etc.

The provider system ensures Collections remains database-agnostic while allowing full customization.
