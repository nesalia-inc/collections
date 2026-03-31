import type { Collection } from '../collections'
import type { Config, ConfigInput } from './types'

export const defineConfig = <T extends Collection[]>(input: ConfigInput<T>): Config<T> => {
  const collections = {} as Record<string, Collection>
  for (const collection of input.collections) {
    collections[collection.slug] = collection
  }
  const db = {} as Config<T>['db']
  return { collections, db } as Config<T>
}
