import type { Collection } from '../../collections'
import type { InferFieldTypes } from '../../collections/hooks/types'
import type { GetCollectionType } from '../../collections/types'
import type { Predicate } from '../where'

export interface FindManyQuery<TData> {
  where?: Predicate<TData>
  orderBy?: keyof TData
  limit?: number
  offset?: number
}

export interface WhereById {
  id: string
}

export type CreateOperation<T> = {
  data: Partial<T>
}

export type CreateManyOperation<T> = {
  data: Partial<T>[]
}

export interface CreateError {
  code: 'ALREADY_EXISTS' | 'INCOMPLETE_DATA' | 'UNKNOWN'
  message: string
  fields?: string[]
}

export type Counted<T> = T & { count: number }

export type CollectionDbMethods<T extends Collection> = {
  findMany: (query?: FindManyQuery<InferFieldTypes<T['fields']>>) => Promise<GetCollectionType<T>[]>
  findUnique: (query: { where: WhereById }) => Promise<GetCollectionType<T> | null>
  findFirst: (query?: { where?: Predicate<InferFieldTypes<T['fields']>>; orderBy?: keyof T['fields'] }) => Promise<GetCollectionType<T> | null>
  create: (input: CreateOperation<InferFieldTypes<T['fields']>>) => Promise<GetCollectionType<T>>
  createMany: (input: CreateManyOperation<InferFieldTypes<T['fields']>>) => Promise<Counted<GetCollectionType<T>[]>>
  update: (input: { where: WhereById; data: Partial<InferFieldTypes<T['fields']>> }) => Promise<GetCollectionType<T>>
  updateById: (id: string, data: Partial<InferFieldTypes<T['fields']>>) => Promise<GetCollectionType<T>>
  delete: (input: { where: WhereById }) => Promise<GetCollectionType<T>>
  deleteById: (id: string) => Promise<GetCollectionType<T>>
  count: (query?: { where?: Predicate<InferFieldTypes<T['fields']>> }) => Promise<number>
  exists: (query: { where: Predicate<InferFieldTypes<T['fields']>> }) => Promise<boolean>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractSlug<C> = C extends Collection<infer S, any> ? S : never

export type DbAccess<T extends Collection[]> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in ExtractSlug<T[number]>]: CollectionDbMethods<Extract<T[number], Collection<K, any>>>
}
