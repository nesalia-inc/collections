import type { Collection } from '../collections'

export interface ConfigInput {
  readonly collections: Collection[]
}

export interface Config {
  readonly collections: Record<string, Collection>
}
