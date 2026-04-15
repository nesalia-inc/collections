/**
 * Adapter Core Module
 */

export type {
  ReferenceAction,
  BaseColumn,
  RawColumn,
  RawIndex,
  RawForeignKey,
  RawTable,
  RawColumnType,
  PostgreSQLOnlyColumnType,
  StandardColumnType,
} from './types'

export { fieldToRawColumn, type FieldToRawColumnOptions } from './fieldToRawColumn'
export {
  collectionToRawTable,
  collectionSlugToTableName,
  type CollectionToRawTableOptions,
} from './collectionToRawTable'
export { buildRawSchema, type BuildRawSchemaOptions } from './buildRawSchema'
export { toSnakeCase } from './utils'
