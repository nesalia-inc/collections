import type { Collection } from '../collections'
import type { Config, ConfigInput } from './types'

export const defineConfig = (input: ConfigInput): Config => {
  const collections: Record<string, Collection> = {}
  for (const collection of input.collections) {
    collections[collection.slug] = collection
  }
  return { collections }
}
