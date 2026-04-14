/**
 * Todos Basic Example
 *
 * This example demonstrates @deessejs/collections with a simple todos collection.
 * It shows:
 * - Defining a collection with f.text(), f.boolean(), f.select()
 * - Using lifecycle hooks (beforeCreate, afterCreate, etc.)
 * - Basic CRUD operations via the collection's database methods
 *
 * Note: This is an in-memory demonstration. The actual database operations
 * would require a Drizzle schema setup. Here we demonstrate the collection
 * definition and hook system.
 */

import { where, eq, or } from '@deessejs/collections'
import { todos, type TodoRecord, type TodosStatus } from './collections'
import { config } from './config'

// Re-export for convenience
export { todos, config }
export type { TodoRecord, TodosStatus }

console.log('='.repeat(60))
console.log('@deessejs/collections - Todos Basic Example')
console.log('='.repeat(60))

/**
 * Demonstrate collection structure
 */
function demonstrateCollectionStructure() {
  console.log('\n--- Collection Structure ---\n')

  const collection = todos

  console.log(`Collection slug: ${collection.slug}`)
  console.log(`Collection name: ${collection.name}`)
  console.log(`Admin description: ${collection.admin?.description ?? 'N/A'}`)
  console.log(`\nFields:`)
  for (const [fieldName, field] of Object.entries(collection.fields)) {
    const fieldType = (field as { fieldType: { type: string } }).fieldType
    const isRequired = (field as { required: boolean }).required
    const hasDefault = (field as { defaultValue?: unknown }).defaultValue !== undefined
    console.log(`  - ${fieldName}:`)
    console.log(`      type: ${fieldType.type}`)
    console.log(`      required: ${isRequired}`)
    console.log(`      hasDefault: ${hasDefault}`)
  }
}

/**
 * Demonstrate field types
 */
function demonstrateFieldTypes() {
  console.log('\n--- Field Types Demo ---\n')

  const titleField = todos.fields.title
  const completedField = todos.fields.completed
  const statusField = todos.fields.status

  console.log('Title field (f.text):')
  console.log(`  Schema valid for "Buy groceries": ${titleField.fieldType.schema.safeParse('Buy groceries').success}`)
  console.log(`  Schema valid for "": ${titleField.fieldType.schema.safeParse('').success}`)
  console.log(`  Schema valid for "A".repeat(300): ${titleField.fieldType.schema.safeParse('A'.repeat(300)).success}`)

  console.log('\nCompleted field (f.boolean):')
  console.log(`  Schema valid for true: ${completedField.fieldType.schema.safeParse(true).success}`)
  console.log(`  Schema valid for false: ${completedField.fieldType.schema.safeParse(false).success}`)
  console.log(`  Schema valid for "true": ${completedField.fieldType.schema.safeParse('true').success}`)

  console.log('\nStatus field (f.select):')
  console.log(`  Schema valid for "pending": ${statusField.fieldType.schema.safeParse('pending').success}`)
  console.log(`  Schema valid for "completed": ${statusField.fieldType.schema.safeParse('completed').success}`)
  console.log(`  Schema valid for "invalid": ${statusField.fieldType.schema.safeParse('invalid').success}`)
}

/**
 * Demonstrate where predicates
 */
function demonstrateWherePredicates() {
  console.log('\n--- Where Predicates Demo ---\n')

  // Create a todo record for type inference
  const mockTodo = {
    title: 'Test todo',
    completed: false,
    status: 'pending' as const,
    id: '123',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // Simple equality
  const predicate1 = where((p) => [eq(p.title, 'Buy groceries')])
  console.log('Predicate: title == "Buy groceries"')
  console.log(`  AST:`, JSON.stringify(predicate1.ast, null, 2))

  // OR predicate
  const predicate2 = where((p) => [
    or(
      eq(p.status, 'pending'),
      eq(p.status, 'in_progress')
    )
  ])
  console.log('\nPredicate: status == "pending" OR status == "in_progress"')
  console.log(`  AST:`, JSON.stringify(predicate2.ast, null, 2))

  // Complex predicate
  const predicate3 = where((p) => [
    eq(p.completed, false),
    or(
      eq(p.status, 'pending'),
      eq(p.status, 'in_progress')
    )
  ])
  console.log('\nPredicate: completed == false AND (status == "pending" OR status == "in_progress")')
  console.log(`  AST:`, JSON.stringify(predicate3.ast, null, 2))
}

/**
 * Demonstrate hooks
 */
function demonstrateHooks() {
  console.log('\n--- Lifecycle Hooks Demo ---\n')

  const hooks = todos.hooks

  console.log('Available hooks:')
  console.log(`  beforeCreate: ${hooks.beforeCreate ? 'defined' : 'not defined'}`)
  console.log(`  afterCreate: ${hooks.afterCreate ? 'defined' : 'not defined'}`)
  console.log(`  beforeUpdate: ${hooks.beforeUpdate ? 'defined' : 'not defined'}`)
  console.log(`  afterUpdate: ${hooks.afterUpdate ? 'defined' : 'not defined'}`)
  console.log(`  beforeDelete: ${hooks.beforeDelete ? 'defined' : 'not defined'}`)
  console.log(`  afterDelete: ${hooks.afterDelete ? 'defined' : 'not defined'}`)
  console.log(`  beforeRead: ${hooks.beforeRead ? 'defined' : 'not defined'}`)
  console.log(`  afterRead: ${hooks.afterRead ? 'defined' : 'not defined'}`)
}

/**
 * Demonstrate CRUD operations structure
 *
 * Note: The database methods (db.todos.findMany, etc.) are only available
 * when a database adapter is configured. Here we show the TypeScript types
 * that would be used.
 */
function demonstrateCrudOperations() {
  console.log('\n--- CRUD Operations Demo ---\n')

  // The config.db type includes todosDb with all CRUD methods
  // At runtime, these methods exist only when a database adapter is configured
  console.log('todosDb methods (from config.db type):')
  console.log('  findMany(query?: FindManyQuery): Promise<TodoRecord[]>')
  console.log('  find(query: FindQuery): Promise<Paginated<TodoRecord>>')
  console.log('  findUnique(query: { where }): Promise<TodoRecord | null>')
  console.log('  findFirst(query?: FindFirstQuery): Promise<TodoRecord | null>')
  console.log('  create(input: { data }): Promise<TodoRecord>')
  console.log('  createMany(input: { data[] }): Promise<CreateManyResult>')
  console.log('  update(input: { where, data }): Promise<UpdateResult>')
  console.log('  delete(query: { where }): Promise<DeleteResult>')
  console.log('  count(query?: { where? }): Promise<number>')
  console.log('  exists(query: { where }): Promise<boolean>')

  console.log('\nNote: Database methods require a database adapter (e.g., pgAdapter)')
  console.log('See @deessejs/collections documentation for database setup.')
}

/**
 * Demonstrate create operation structure
 */
async function demonstrateCreateOperation() {
  console.log('\n--- Create Operation Demo ---\n')

  // Simulate what a create operation would look like
  const createInput = {
    data: {
      title: 'Learn @deessejs/collections',
      completed: false,
      status: 'pending' as const,
    },
  }

  console.log('Create input:')
  console.log(JSON.stringify(createInput, null, 2))

  // Simulate hook execution
  if (todos.hooks.beforeCreate) {
    const ctx = {
      collection: 'todos',
      operation: 'create' as const,
      data: { ...createInput.data },
    }
    const result = await todos.hooks.beforeCreate(ctx)
    console.log('\nAfter beforeCreate hook (title trimmed):')
    console.log(`  title: "${result.data.title}"`)
  }

  console.log('\nNote: Actual database create requires a Drizzle schema setup.')
}

/**
 * Demonstrate update operation structure
 */
async function demonstrateUpdateOperation() {
  console.log('\n--- Update Operation Demo ---\n')

  const updateInput = {
    where: where((p) => [eq(p.id, 'todo-123')]),
    data: {
      completed: true,
      status: 'completed' as const,
    },
  }

  console.log('Update input:')
  console.log(JSON.stringify(updateInput, null, 2))

  console.log('\nNote: Actual database update requires a Drizzle schema setup.')
}

/**
 * Demonstrate pagination
 */
function demonstratePagination() {
  console.log('\n--- Pagination Demo ---\n')

  const paginationQuery = {
    pagination: {
      mode: 'offset' as const,
      page: 1,
      pageSize: 10,
    },
  }

  const cursorPaginationQuery = {
    pagination: {
      mode: 'cursor' as const,
      cursor: { id: 'todo-123' },
      pageSize: 10,
    },
  }

  console.log('Offset pagination:')
  console.log(JSON.stringify(paginationQuery, null, 2))

  console.log('\nCursor pagination:')
  console.log(JSON.stringify(cursorPaginationQuery, null, 2))
}

/**
 * Main entry point
 */
async function main() {
  console.log('\nRunning demos...\n')

  demonstrateCollectionStructure()
  demonstrateFieldTypes()
  demonstrateWherePredicates()
  demonstrateHooks()
  demonstrateCrudOperations()
  await demonstrateCreateOperation()
  await demonstrateUpdateOperation()
  demonstratePagination()

  console.log('\n' + '='.repeat(60))
  console.log('Demo complete!')
  console.log('='.repeat(60))
  console.log('\nTo run this app with a real database:')
  console.log('  1. Set up your Drizzle schema')
  console.log('  2. Configure the database connection')
  console.log('  3. Use todosDb.create(), todosDb.findMany(), etc.')
  console.log('\nRun with: pnpm dev')
}

// Run the demo
main().catch(console.error)
