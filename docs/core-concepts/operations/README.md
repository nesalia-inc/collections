# Collection Operations

Learn how to perform CRUD operations on collections.

## Overview

Collections provide a type-safe API for database operations. Each collection gets automatically generated methods based on its fields.

```typescript
const config = defineConfig({
  database: pgAdapter({ url: process.env.DATABASE_URL! }),
  collections: [posts, users]
})

// Access collection operations
config.db.posts.find()
config.db.posts.create()
config.db.posts.update()
config.db.posts.delete()

// Extend methods (if defined)
config.db.posts.publish()
config.db.posts.archive()
```

## Documents

- [Find](./find.md) - Reading records (find, findById, findFirst, count, exists)
- [Create](./create.md) - Creating records
- [Update](./update.md) - Updating records
- [Delete](./delete.md) - Deleting records
- [Where](./where.md) - Where conditions for filtering
- [Options](./options.md) - Query options (orderBy, include, select)
- [Results](./results.md) - Return values and result pattern
- [Transactions](./transactions.md) - Atomic operations

## Summary

| Operation | Method | Description |
|-----------|--------|-------------|
| Read | `find(ops)` | Get all records |
| Read | `findById(id)` | Get by ID |
| Read | `findFirst(ops)` | Get first match |
| Read | `count(ops)` | Count records |
| Read | `exists(ops)` | Check existence |
| Write | `create(ops)` | Create record |
| Write | `createMany(ops)` | Create multiple |
| Write | `update(ops)` | Update record |
| Write | `updateMany(ops)` | Update multiple |
| Write | `delete(ops)` | Delete record |
| Write | `deleteMany(ops)` | Delete multiple |
