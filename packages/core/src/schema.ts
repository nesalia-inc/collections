import { pgTable, serial, text, timestamp, uuid, varchar, boolean, integer } from 'drizzle-orm/pg-core'

import type { Collection } from './collection'

/**
 * Build Drizzle table from collection definition
 */
export const buildTable = (collection: Collection) => {
  // Build columns object
  const columns: Record<string, unknown> = {
    // Add default id column
    id: serial('id').primaryKey()
  }

  // Build columns from fields
  for (const [fieldName, fieldDef] of Object.entries(collection.fields)) {
    // Skip the id field if explicitly defined in fields
    if (fieldName === 'id') continue

    const fieldType = fieldDef.fieldType as { name?: string; type?: string }
    const fieldTypeName = fieldType.name || fieldType.type || 'text'

    switch (fieldTypeName) {
      case 'text':
        columns[fieldName] = text(fieldName)
        break
      case 'varchar':
        columns[fieldName] = varchar(fieldName, { length: 255 })
        break
      case 'number':
      case 'integer':
        columns[fieldName] = integer(fieldName)
        break
      case 'boolean':
        columns[fieldName] = boolean(fieldName)
        break
      case 'timestamp':
        columns[fieldName] = timestamp(fieldName)
        break
      case 'uuid':
        columns[fieldName] = uuid(fieldName)
        break
      default:
        columns[fieldName] = text(fieldName)
    }
  }

  return pgTable(collection.slug, columns as Record<string, ReturnType<typeof text>>)
}

/**
 * Build all tables from collections
 */
export const buildSchema = (collections: Collection[]) => {
  const tables: Record<string, ReturnType<typeof pgTable>> = {}

  for (const coll of collections) {
    tables[coll.slug] = buildTable(coll)
  }

  return tables
}
