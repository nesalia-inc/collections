import type { FieldDefinition } from './field'

/**
 * Collection configuration
 */
export type CollectionConfig<T extends Record<string, unknown> = Record<string, unknown>> = {
  slug: string
  name?: string
  fields: Record<string, FieldDefinition>
  hooks?: CollectionHooks
  dataType?: T
}

/**
 * Operation types
 */
export type OperationType = 'create' | 'update' | 'delete' | 'read'

/**
 * Hook context base
 */
export type HookContextBase = {
  collection: string
  operation: OperationType
}

/**
 * Before/After Operation context
 */
export type OperationHookContext = HookContextBase & {
  data?: Record<string, unknown>
  where?: Record<string, unknown>
  result?: unknown
}

/**
 * Before/After Create context
 */
export type CreateHookContext = HookContextBase & {
  operation: 'create'
  data: Record<string, unknown>
  result?: unknown
  db?: unknown
}

/**
 * Before/After Update context
 */
export type UpdateHookContext = HookContextBase & {
  operation: 'update'
  data: Record<string, unknown>
  where: Record<string, unknown>
  previousData?: Record<string, unknown>
  result?: unknown
  db?: unknown
}

/**
 * Before/After Delete context
 */
export type DeleteHookContext = HookContextBase & {
  operation: 'delete'
  where: Record<string, unknown>
  previousData?: Record<string, unknown>
  result?: unknown
  db?: unknown
}

/**
 * Before/After Read context
 */
export type ReadHookContext = HookContextBase & {
  operation: 'read'
  query?: Record<string, unknown>
  result?: unknown[]
  db?: unknown
}

/**
 * Generic hook function type
 */
export type GenericHookFunction = (context: OperationHookContext) => Promise<void> | void
export type CreateHookFunction = (context: CreateHookContext) => Promise<void> | void
export type UpdateHookFunction = (context: UpdateHookContext) => Promise<void> | void
export type DeleteHookFunction = (context: DeleteHookContext) => Promise<void> | void
export type ReadHookFunction = (context: ReadHookContext) => Promise<void> | void

/**
 * Collection hooks
 */
export type CollectionHooks = {
  beforeOperation?: GenericHookFunction[]
  afterOperation?: GenericHookFunction[]
  beforeCreate?: CreateHookFunction[]
  afterCreate?: CreateHookFunction[]
  beforeUpdate?: UpdateHookFunction[]
  afterUpdate?: UpdateHookFunction[]
  beforeDelete?: DeleteHookFunction[]
  afterDelete?: DeleteHookFunction[]
  beforeRead?: ReadHookFunction[]
  afterRead?: ReadHookFunction[]
}

/**
 * A collection definition
 */
export type Collection<T extends Record<string, unknown> = Record<string, unknown>> = {
  slug: string
  name?: string
  fields: Record<string, FieldDefinition>
  hooks?: CollectionHooks
  dataType?: T
}

/**
 * Creates a new collection
 *
 * @example
 * export const users = collection({
 *   slug: 'users',
 *   name: 'Users',
 *   fields: {
 *     name: field({ fieldType: text }),
 *     email: field({ fieldType: email, unique: true })
 *   }
 * })
 */
export const collection = <T extends Record<string, unknown> = Record<string, unknown>>(
  config: CollectionConfig<T>
): Collection<T> => {
  return {
    slug: config.slug,
    name: config.name,
    fields: config.fields,
    hooks: config.hooks,
    dataType: config.dataType
  }
}
