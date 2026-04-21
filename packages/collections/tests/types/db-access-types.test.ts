// DbAccess compile-time tests
// Tests that DbAccess correctly constructs the database access object type

import { check, Equal } from '@deessejs/type-testing'
import type { Collection } from '../../src/collections'
import type { DbAccess, CollectionDbMethods } from '../../src/operations/database/types'
import type { Field } from '../../src/fields'

/**
 * DbAccess<TCollections> provides type-safe access to all collection methods.
 * It creates a mapped type with collection slugs as keys and CollectionDbMethods as values.
 */

// Single collection access
type UsersCollection = Collection<'users', { name: Field<string> & { required: true } }>
check<Equal<
  DbAccess<[UsersCollection]>,
  { users: CollectionDbMethods<UsersCollection> }
>>()

// Multiple collections access
type PostsCollection = Collection<'posts', { title: Field<string> & { required: true } }>
type CommentsCollection = Collection<'comments', { body: Field<string> & { required: true } }>
check<Equal<
  DbAccess<[UsersCollection, PostsCollection, CommentsCollection]>,
  {
    users: CollectionDbMethods<UsersCollection>
    posts: CollectionDbMethods<PostsCollection>
    comments: CollectionDbMethods<CommentsCollection>
  }
>>()

// Empty collection array -> empty object
check<Equal<
  DbAccess<[]>,
  {}
>>()

// Access respects collection slug
type ProductsCollection = Collection<'products', { name: Field<string> & { required: true } }>
check<Equal<
  DbAccess<[ProductsCollection]>,
  { products: CollectionDbMethods<ProductsCollection> }
>>()