# Instance Methods (Record-Level)

Enrich returned records with custom methods.

## Overview

The `methods` property enriches returned records with custom methods. Each record becomes an "enriched" object that has access to both its data and custom methods.

```typescript
const tasks = collection({
  slug: 'tasks',
  fields: {
    title: field({ fieldType: f.text() }),
    completed: field({ fieldType: f.boolean() }),
    completedAt: field({ fieldType: f.timestamp(), required: false })
  },

  // Instance methods
  methods: {
    // Complete the task
    complete: async (task) => {
      await db.tasks.update({
        where: { id: task.id },
        data: { completed: true, completedAt: new Date() }
      })
    },

    // Add a note to the task
    addNote: async (task, { note }: { note: string }) => {
      await db.task_notes.create({
        data: { taskId: task.id, note }
      })
    }
  }
})
```

## Usage

```typescript
// findById returns enriched record
const { data: task } = await db.tasks.findById({ id: "123" })
await task.complete()
await task.addNote({ note: "Finished early!" })

// find returns array of enriched records
const { data: tasks } = await db.tasks.find({})
for (const task of tasks) {
  await task.complete()
}
```

## Method Signature

```typescript
methods: {
  methodName: async (record, params?, context?) => {
    // record: the current record data (task.id, task.title, etc.)
    // params: additional parameters passed to the method
    // context: { db, user }
  }
}
```

## Context

Instance methods receive the record itself as first argument:

```typescript
methods: {
  myMethod: async (record, params, { db, user }) => {
    // record: the current record data (task.id, task.title, etc.)
    // params: additional parameters passed to the method
    // db: database instance
    // user: current authenticated user
  }
}
```

## Examples

### Complete Task

```typescript
methods: {
  complete: async (task) => {
    await db.tasks.update({
      where: { id: task.id },
      data: { completed: true, completedAt: new Date() }
    })
  },

  uncomplete: async (task) => {
    await db.tasks.update({
      where: { id: task.id },
      data: { completed: false, completedAt: null }
    })
  }
}
```

### With Parameters

```typescript
methods: {
  updateStatus: async (task, { status }: { status: string }) => {
    await db.tasks.update({
      where: { id: task.id },
      data: { status }
    })
  },

  assignTo: async (task, { userId }: { userId: string }) => {
    await db.task_assignments.create({
      data: { taskId: task.id, userId }
    })
  }
}
```

### Complex Actions

```typescript
methods: {
  archive: async (task, { reason }: { reason: string }) => {
    // Create archive record
    await db.task_archives.create({
      data: {
        taskId: task.id,
        title: task.title,
        reason,
        archivedAt: new Date()
      }
    })

    // Delete original
    await db.tasks.delete({ where: { id: task.id } })
  }
}
```

## Chaining

Instance methods can return values for chaining:

```typescript
methods: {
  complete: async (task) => {
    await db.tasks.update({
      where: { id: task.id },
      data: { completed: true }
    })
    return task  // Return for chaining
  },

  notify: async (task) => {
    await sendNotification(task.id)
    return task
  }
}

// Chain methods
const { data: task } = await db.tasks.findById({ id: "123" })
await task.complete().notify()
```

## TypeScript

Methods are fully typed:

```typescript
methods: {
  complete: async (
    task: Task,  // Inferred from collection fields
    params: { note?: string },
    context: { db: Database; user?: User }
  ) => {
    // Full type inference
  }
}
```
