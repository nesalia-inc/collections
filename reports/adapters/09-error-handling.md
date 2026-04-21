# Error Handling

## Error Types (planned - not yet implemented)

```typescript
// src/adapter/errors.ts

export class AdapterError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AdapterError'
  }
}

export class UniqueConstraintError extends AdapterError {
  constructor(field: string, value: unknown) {
    super(
      `Unique constraint violated on field '${field}'`,
      'UNIQUE_CONSTRAINT',
      { field, value }
    )
    this.name = 'UniqueConstraintError'
  }
}

export class NotFoundError extends AdapterError {
  constructor(collection: string, id: string | number) {
    super(
      `Record not found in '${collection}' with id '${id}'`,
      'NOT_FOUND',
      { collection, id }
    )
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AdapterError {
  constructor(message: string, fields?: string[]) {
    super(message, 'VALIDATION_ERROR', { fields })
    this.name = 'ValidationError'
  }
}
```

## Create Operation with Hooks and Validation

```typescript
// src/adapter/operations/create.ts

import type { CreateInput, InferCreateType } from '../../operations/database/types'
import type { Field } from '../../fields'

// Note: In the actual codebase, hooks use ctx.data which is mutable
// The adapter needs to call hooks before the database operation

export const create = async <T extends Collection>(
  adapter: DatabaseAdapter,
  collection: T,
  input: CreateInput<T['fields']>,
  ctx?: QueryContext
): Promise<GetCollectionType<T>> => {
  const table = adapter.tables[toSnakeCase(collection.slug)]

  try {
    // Run beforeCreate hooks - ctx is mutable
    let data = { ...input.data }
    if (collection.hooks?.beforeCreate) {
      for (const hook of collection.hooks.beforeCreate) {
        const result = await hook({ collection: collection.slug, operation: 'create', data })
        if ('_stop' in result) {
          return result.data as GetCollectionType<T>
        }
        data = result.data
      }
    }

    // Validate using field schemas
    const validated: Record<string, unknown> = {}
    for (const [fieldName, field] of Object.entries(collection.fields)) {
      const value = (data as any)[fieldName]
      if (value !== undefined) {
        validated[fieldName] = field.fieldType.schema.parse(value)
      }
    }

    // Insert via adapter
    const result = await adapter.db.insert(table).values(validated)

    // Run afterCreate hooks
    if (collection.hooks?.afterCreate) {
      for (const hook of collection.hooks.afterCreate) {
        await hook({ collection: collection.slug, operation: 'create', data: result })
      }
    }

    return result
  } catch (error) {
    if (error instanceof AdapterError) throw error

    // Handle Drizzle unique constraint errors
    // PostgreSQL error code 23505 is for unique violation
    const pgError = error as { code?: string }
    if (pgError.code === '23505') {
      const field = parseUniqueViolationField(error)
      throw new UniqueConstraintError(field, null)
    }

    throw new AdapterError(
      error instanceof Error ? error.message : 'Unknown error during create',
      'UNKNOWN',
      { originalError: error }
    )
  }
}
```

## PostgreSQL Error Codes

| Code | Meaning | Handling |
|------|---------|----------|
| 23505 | Unique violation | Throw `UniqueConstraintError` |
| 23503 | Foreign key violation | Throw `ForeignKeyError` |
| 23502 | Not null violation | Throw `ValidationError` |
| 22P02 | Invalid text representation | Throw `ValidationError` |
