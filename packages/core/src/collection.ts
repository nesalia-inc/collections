import type { FieldDefinition } from './field'

/**
 * Collection configuration
 */
export interface CollectionConfig {
  slug: string
  name?: string
  fields: Record<string, FieldDefinition>
  hooks?: CollectionHooks
}

/**
 * Collection hooks
 */
export interface CollectionHooks {
  beforeCreate?: HookFunction[]
  afterCreate?: HookFunction[]
  beforeUpdate?: HookFunction[]
  afterUpdate?: HookFunction[]
  beforeDelete?: HookFunction[]
  afterDelete?: HookFunction[]
}

/**
 * Hook function type
 */
export type HookFunction = (context: HookContext) => Promise<void> | void

/**
 * Hook context
 */
export interface HookContext {
  data?: Record<string, unknown>
  result?: unknown
  where?: Record<string, unknown>
}

/**
 * A collection definition
 */
export interface Collection {
  slug: string
  name?: string
  fields: Record<string, FieldDefinition>
  hooks?: CollectionHooks
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
export function collection(config: CollectionConfig): Collection {
  return {
    slug: config.slug,
    name: config.name,
    fields: config.fields,
    hooks: config.hooks
  }
}
