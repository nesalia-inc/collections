// InferFieldTypes compile-time tests
// Tests that InferFieldTypes correctly extracts field value types

import { check, Equal } from '@deessejs/type-testing'
import type { Field } from '../../src/fields'
import type { InferFieldTypes } from '../../src/collections/hooks/types'

/**
 * InferFieldTypes<TFields> extracts the value type from each Field<T> in a record.
 * - Field<string> -> string
 * - Field<number> -> number
 * - Field<boolean> -> boolean
 */

// String field -> string
check<Equal<
  InferFieldTypes<{ name: Field<string> }>,
  { name: string }
>>()

// Number field -> number
check<Equal<
  InferFieldTypes<{ age: Field<number> }>,
  { age: number }
>>()

// Boolean field -> boolean
check<Equal<
  InferFieldTypes<{ active: Field<boolean> }>,
  { active: boolean }
>>()

// Multiple fields -> object with all types
check<Equal<
  InferFieldTypes<{
    name: Field<string>
    age: Field<number>
    active: Field<boolean>
  }>,
  {
    name: string
    age: number
    active: boolean
  }
>>()

// Date field -> Date
check<Equal<
  InferFieldTypes<{ createdAt: Field<Date> }>,
  { createdAt: Date }
>>()

// Mixed types -> mixed result
check<Equal<
  InferFieldTypes<{
    title: Field<string>
    count: Field<number>
    metadata: Field<Record<string, unknown>>
  }>,
  {
    title: string
    count: number
    metadata: Record<string, unknown>
  }
>>()

// Empty fields -> empty object
check<Equal<
  InferFieldTypes<{}>,
  {}
>>()