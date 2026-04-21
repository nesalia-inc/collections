// GetCollectionType compile-time tests
// Tests that GetCollectionType correctly extracts collection read types

import { check, Equal } from '@deessejs/type-testing'
import type { Field } from '../../src/fields'
import type { Collection } from '../../src/collections'
import type { GetCollectionType } from '../../src/collections/types'

/**
 * GetCollectionType<T> extracts the TypeScript type representing a collection record.
 * Required fields remain required, optional fields become optional (T | undefined).
 */

// Required field -> non-optional in read result
check<Equal<
  GetCollectionType<Collection<'users', { name: Field<string> & { required: true } }>>,
  { name: string }
>>()

// Optional field -> optional in read result
check<Equal<
  GetCollectionType<Collection<'users', { bio: Field<string> }>>,
  { bio?: string }
>>()

// Read result always has optional for non-required fields (like InferFieldTypes)
check<Equal<
  GetCollectionType<Collection<'posts', { title: Field<string>, content: Field<string> }>>,
  { title?: string, content?: string }
>>()

// Required fields stay required in read result
check<Equal<
  GetCollectionType<Collection<'products', {
    name: Field<string> & { required: true }
    price: Field<number> & { required: true }
  }>>,
  { name: string, price: number }
>>()

// Mixed required/optional
check<Equal<
  GetCollectionType<Collection<'orders', {
    status: Field<string> & { required: true }
    notes: Field<string>
  }>>,
  { status: string, notes?: string }
>>()