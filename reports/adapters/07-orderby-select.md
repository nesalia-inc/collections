# OrderBy and Select Converters

## OrderBy to Drizzle

```typescript
// src/adapter/queries/orderByToDrizzle.ts

import { asc, desc, SQL } from 'drizzle-orm'
import type { OrderBy, OrderByNode } from '../../operations/order-by'
import type { AnyTable } from 'drizzle-orm'

export const orderByToDrizzle = <T extends Record<string, unknown>>(
  orderBy: OrderBy<T>,
  table: AnyTable
): SQL[] => {
  const results: SQL[] = []

  // OrderBy uses ast property (array of OrderNode)
  for (const node of orderBy.ast) {
    const col = table[node.field]
    if (!col) {
      throw new Error(`Invalid orderBy field: ${node.field}`)
    }
    results.push(node.direction === 'asc' ? asc(col) : desc(col))
  }

  return results
}
```

## Select/Field Projection

The actual `select()` syntax uses a generic type parameter:

```typescript
// src/adapter/queries/selectToDrizzle.ts

import type { SelectInput, Selection } from '../../operations/select'
import type { AnyTable } from 'drizzle-orm'

// SelectInput is a function that receives a PathProxy and returns selected fields
// Selection<TEntity, TResult> has the ast property with array of field nodes
export const selectToDrizzle = <T extends Record<string, unknown>>(
  select: SelectInput<T>,
  table: AnyTable
): Record<string, unknown> => {
  // Create a proxy that tracks field access
  const accessedFields: string[] = []
  const proxy = new Proxy({} as T, {
    get(_target, prop) {
      if (typeof prop === 'string' && prop !== 'then' && prop !== 'toJSON') {
        accessedFields.push(prop)
      }
      return prop
    }
  })

  // Call the select function with our tracking proxy
  const result = select(proxy)

  // Build the columns object from accessed fields
  const columns: Record<string, unknown> = {}
  for (const field of accessedFields) {
    if (field in table) {
      columns[field] = table[field]
    }
  }

  return columns
}
```

## Real Usage Syntax

```typescript
import { select, orderBy, asc, desc } from '@deessejs/collections'

// Order by syntax - uses asc()/desc() helpers
const ordering = orderBy<Post>(p => [
  desc(p.createdAt),
  asc(p.title),
])

// Select syntax - generic type parameter
const selection = select<Post>()(p => ({
  id: p.id,
  title: p.title,
  createdAt: p.createdAt,
}))
```

## Usage in findMany

```typescript
// Example usage in findMany
const where = whereToDrizzle(query.where, table)
const orderBy = orderByToDrizzle(query.orderBy, table)
const select = query.select ? selectToDrizzle(query.select, table) : undefined

const result = await adapter.db
  .select(select)
  .from(table)
  .where(where)
  .orderBy(...orderBy)
  .limit(query.pagination?.limit ?? 50)
  .offset(query.pagination?.offset ?? 0)
```
