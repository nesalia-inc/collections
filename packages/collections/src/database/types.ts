import type { Collection } from '../collections'
import type { InferFieldTypes } from '../collections/hooks/types'
import type { GetCollectionType } from '../collections/types'

export interface FindManyQuery<TData> {
  where?: Partial<TData>
  orderBy?: keyof TData
  limit?: number
  offset?: number
}

export interface WhereById {
  id: string
}

export type CollectionDbMethods<T extends Collection> = {
  findMany: (query?: FindManyQuery<InferFieldTypes<T['fields']>>) => Promise<GetCollectionType<T>[]>
  findUnique: (query: { where: WhereById }) => Promise<GetCollectionType<T> | null>
  findFirst: (query?: { where: Partial<InferFieldTypes<T['fields']>>; orderBy?: keyof T['fields'] }) => Promise<GetCollectionType<T> | null>
  create: (input: { data: Partial<InferFieldTypes<T['fields']>> }) => Promise<GetCollectionType<T>>
  update: (input: { where: WhereById; data: Partial<InferFieldTypes<T['fields']>> }) => Promise<GetCollectionType<T>>
  delete: (input: { where: WhereById }) => Promise<GetCollectionType<T>>
  count: (query?: { where?: Partial<InferFieldTypes<T['fields']>> }) => Promise<number>
  exists: (query: { where: Partial<InferFieldTypes<T['fields']>> }) => Promise<boolean>
}

type ExtractSlug<C> = C extends Collection<infer S, any> ? S : never

export type DbAccess<T extends Collection[]> = {
  [K in ExtractSlug<T[number]>]: CollectionDbMethods<Extract<T[number], Collection<K, any>>>
}
