import { fieldType, type FieldTypeCreator } from '../field-type'
import { z } from 'zod'

/**
 * Relation field type options
 */
export type RelationOptions = {
  collection: string
  singular?: boolean
  many?: boolean
  through?: string
}

/**
 * Creates a relation field type for foreign key relationships
 */
export const relation = (options: RelationOptions): FieldTypeCreator => {
  const isMany = options.many ?? false
  const isSingular = options.singular ?? false

  return fieldType({
    schema: isMany ? z.array(z.string()) : z.string(),
    database: {
      type: 'integer',
      references: options.collection,
      through: options.through,
      many: isMany,
      singular: isSingular
    }
  })
}
