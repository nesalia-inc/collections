import type { Collection } from '../collections'
import type { Config, ConfigInput } from './types'

export const defineConfig = <T extends Collection[]>(input: ConfigInput<T>): Config<T> => {
  const collections = {} as Record<string, Collection>
  for (const collection of input.collections) {
    collections[collection.slug] = collection
  }
  return { collections } as Config<T>
}
