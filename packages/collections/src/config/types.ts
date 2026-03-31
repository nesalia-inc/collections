import type { Collection } from '../collections'
import type { DbAccess } from '../database'

export interface ConfigInput<T extends Collection[]> {
  readonly collections: T
}

type CollectionsRecord<T extends Collection[]> = {
  [K in T[number] as K extends Collection<infer S> ? S : never]: K
}

export type Config<T extends Collection[]> = {
  readonly collections: CollectionsRecord<T>
  readonly db: DbAccess<T>
}
