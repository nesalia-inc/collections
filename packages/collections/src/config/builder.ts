import type { Collection } from '../collections'
import type { Config, ConfigInput } from './types'
import { MigrationsConfig } from './types'

const DEFAULT_MIGRATIONS_DIR = './drizzle'
const DEFAULT_MIGRATIONS_TABLE = '__collections_migrations'

const resolveMigrationsConfig = (migrations?: MigrationsConfig) => ({
  dir: migrations?.dir ?? DEFAULT_MIGRATIONS_DIR,
  table: migrations?.table ?? DEFAULT_MIGRATIONS_TABLE,
})

export const defineCollections = <T extends Collection[]>(input: ConfigInput<T>): Config<T> => {
  const collections = {} as Record<string, Collection>
  for (const collection of input.collections) {
    collections[collection.slug] = collection
  }
  // Pass through the db connection input directly
  const db = input.db
  const migrations = resolveMigrationsConfig(input.migrations)
  return { collections, db, migrations } as Config<T>
}
