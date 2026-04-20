/**
 * Todos Basic Example
 *
 * This example demonstrates @deessejs/collections with a simple todos collection.
 * It shows:
 * - Defining a collection with f.text(), f.boolean(), f.select()
 * - Using lifecycle hooks (beforeCreate, afterCreate, etc.)
 * - Basic CRUD operations via the collection's database methods
 * - Setting up SQLite in-memory database with createCollections
 */

import { collection, field, f, where, eq, createCollections, sqlite } from '@deessejs/collections'
import { isOk, isErr } from '@deessejs/core'
import Database from 'better-sqlite3'

// =============================================================================
// Collection Definition
// =============================================================================

const todos = collection({
  slug: 'todos',
  name: 'Todos',
  admin: {
    description: 'Simple todo items with status tracking',
    icon: 'checklist',
  },
  fields: {
    title: field({
      fieldType: f.text({ minLength: 1, maxLength: 200 }),
      required: true,
    }),
    completed: field({
      fieldType: f.boolean(),
      defaultValue: false,
    }),
    status: field({
      fieldType: f.select(['pending', 'in_progress', 'completed']),
      defaultValue: 'pending',
    }),
  },
  hooks: {
    beforeCreate: async (ctx) => {
      console.log(`[Hook] beforeCreate: Creating todo "${ctx.data.title}"`)
      // Ensure title is trimmed
      if (typeof ctx.data.title === 'string') {
        ctx.data.title = ctx.data.title.trim()
      }
      return ctx
    },
    afterCreate: async (ctx) => {
      console.log(`[Hook] afterCreate: Created todo with id`)
      return ctx
    },
    beforeUpdate: async (ctx) => {
      console.log(`[Hook] beforeUpdate: Updating todo`)
      return ctx
    },
    afterUpdate: async (ctx) => {
      console.log(`[Hook] afterUpdate: Updated todo`)
      return ctx
    },
    beforeDelete: async (ctx) => {
      console.log(`[Hook] beforeDelete: Deleting todo`)
      return ctx
    },
    afterDelete: async (ctx) => {
      console.log(`[Hook] afterDelete: Deleted todo`)
      return ctx
    },
  },
})

// Type representing a todo record
type TodoRecord = {
  id: string
  title: string
  completed: boolean
  status: 'pending' | 'in_progress' | 'completed'
  createdAt: Date
  updatedAt: Date
}

// =============================================================================
// SQLite Setup
// =============================================================================

// Create in-memory SQLite database (better-sqlite3 instance)
// Using ':memory:' creates a temporary in-memory database
const sqliteDb = new Database(':memory:')

// Create collections with database access
const result = await createCollections({
  collections: [todos],
  db: sqlite(sqliteDb),
})

if (isErr(result)) {
  console.error('Failed to create collections:', result.error)
  process.exit(1)
}

const { db } = result.value

console.log('='.repeat(60))
console.log('@deessejs/collections - Todos Basic Example')
console.log('='.repeat(60))

// =============================================================================
// Main Demo
// =============================================================================

async function main() {
  // Push schema to create tables: npx @deessejs/collections push
  // db.$push() is no longer available

  console.log('\nRunning CRUD demos...\n')

  // =============================================================================
  // CREATE - Insert a new todo
  // =============================================================================
  console.log('--- CREATE Operation ---\n')

  const createResult1 = await db.todos.create({
    data: {
      title: 'Buy groceries',
      completed: false,
      status: 'pending',
    },
  })
  if (isErr(createResult1)) {
    console.error('Failed to create todo:', createResult1.error)
    return
  }
  const newTodo = createResult1.value
  console.log('Created todo:', newTodo)

  // Create another todo
  const createResult2 = await db.todos.create({
    data: {
      title: 'Learn TypeScript',
      completed: false,
      status: 'in_progress',
    },
  })
  if (isErr(createResult2)) {
    console.error('Failed to create todo 2:', createResult2.error)
    return
  }
  const newTodo2 = createResult2.value
  console.log('Created todo:', newTodo2)

  // =============================================================================
  // READ - Find many todos
  // =============================================================================
  console.log('\n--- READ Operations (findMany) ---\n')

  const allTodos = await db.todos.findMany()
  console.log('All todos:', allTodos)

  // Find with where clause
  const pendingTodos = await db.todos.findMany({
    where: where((p) => [eq(p.status, 'pending')]),
  })
  console.log('\nPending todos:', pendingTodos)

  // Find with AND condition
  const pendingIncompleteTodos = await db.todos.findMany({
    where: where((p) => [eq(p.status, 'pending'), eq(p.completed, false)]),
  })
  console.log('Pending incomplete todos:', pendingIncompleteTodos)

  // =============================================================================
  // READ - Find unique by ID
  // =============================================================================
  console.log('\n--- READ Operations (findUnique) ---\n')

  const foundTodo = await db.todos.findUnique({
    where: where((p) => [eq(p.id, newTodo.id)]),
  })
  console.log('Found todo by id:', foundTodo)

  // =============================================================================
  // READ - Find first
  // =============================================================================
  console.log('\n--- READ Operations (findFirst) ---\n')

  const firstInProgress = await db.todos.findFirst({
    where: where((p) => [eq(p.status, 'in_progress')]),
  })
  console.log('First in-progress todo:', firstInProgress)

  // =============================================================================
  // UPDATE - Update a todo
  // =============================================================================
  console.log('\n--- UPDATE Operations ---\n')

  const updateResult1 = await db.todos.update({
    where: where((p) => [eq(p.id, newTodo.id)]),
    data: {
      completed: true,
      status: 'completed',
    },
  })
  if (isErr(updateResult1)) {
    console.error('Failed to update todo:', updateResult1.error)
    return
  }
  console.log('Updated todo:', updateResult1.value)

  // Update with title change
  const updateResult2 = await db.todos.update({
    where: where((p) => [eq(p.id, newTodo2.id)]),
    data: {
      title: 'Learn TypeScript with Drizzle',
      status: 'completed',
      completed: true,
    },
  })
  if (isErr(updateResult2)) {
    console.error('Failed to update todo 2:', updateResult2.error)
    return
  }
  console.log('Updated todo 2:', updateResult2.value)

  // =============================================================================
  // READ - After updates
  // =============================================================================
  console.log('\n--- READ After Updates ---\n')

  const completedTodos = await db.todos.findMany({
    where: where((p) => [eq(p.status, 'completed')]),
  })
  console.log('Completed todos:', completedTodos)

  const allTodosAfterUpdate = await db.todos.findMany()
  console.log('\nAll todos after update:', allTodosAfterUpdate)

  // =============================================================================
  // COUNT & EXISTS
  // =============================================================================
  console.log('\n--- COUNT & EXISTS ---\n')

  const totalCount = await db.todos.count()
  console.log('Total todos count:', totalCount)

  const completedCount = await db.todos.count({
    where: where((p) => [eq(p.status, 'completed')]),
  })
  console.log('Completed todos count:', completedCount)

  const hasIncompleteTodos = await db.todos.exists({
    where: where((p) => [eq(p.completed, false)]),
  })
  console.log('Has incomplete todos:', hasIncompleteTodos)

  // =============================================================================
  // DELETE - Delete a todo
  // =============================================================================
  console.log('\n--- DELETE Operation ---\n')

  const deleteResult = await db.todos.delete({
    where: where((p) => [eq(p.id, newTodo.id)]),
  })
  if (isErr(deleteResult)) {
    console.error('Failed to delete todo:', deleteResult.error)
    return
  }
  console.log('Deleted todo:', deleteResult.value)

  const remainingTodos = await db.todos.findMany()
  console.log('\nRemaining todos after delete:', remainingTodos)

  // =============================================================================
  // CREATE MANY - Batch insert
  // =============================================================================
  console.log('\n--- CREATE MANY Operation ---\n')

  const batchResult = await db.todos.createMany({
    data: [
      { title: 'Task 1', completed: false, status: 'pending' },
      { title: 'Task 2', completed: false, status: 'pending' },
      { title: 'Task 3', completed: false, status: 'pending' },
    ],
  })
  console.log('Batch create result:', batchResult)

  const allTodosAfterBatch = await db.todos.findMany()
  console.log('\nAll todos after batch create:', allTodosAfterBatch)

  console.log('\n' + '='.repeat(60))
  console.log('CRUD Demo complete!')
  console.log('='.repeat(60))
}

// Run the demo
main().catch(console.error)
