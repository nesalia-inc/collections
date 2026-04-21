// InferCreateType compile-time tests
// Tests that InferCreateType correctly determines create input types

import { check, Equal } from '@deessejs/type-testing'
import type { Field } from '../../src/fields'
import type { InferCreateType } from '../../src/operations/database/types'

/**
 * InferCreateType<TFields> determines the input type for create operations.
 * A field becomes optional in create if:
 * - It has no required: true flag
 * - It has a defaultValue or defaultFactory
 */

// Required field -> non-optional in create (must provide value)
check<Equal<
  InferCreateType<{ name: Field<string> & { required: true } }>,
  { name: string }
>>()

// Optional field (no required, no defaultValue) -> optional in create
check<Equal<
  InferCreateType<{ bio: Field<string> }>,
  { bio?: string }
>>()

// Field with defaultValue -> effectively required (non-optional)
check<Equal<
  InferCreateType<{
    active: Field<boolean>
    defaultValue: () => true
  }>,
  { active: boolean }
>>()

// Field with defaultFactory -> effectively required (non-optional)
check<Equal<
  InferCreateType<{
    status: Field<string>
    defaultFactory: () => 'pending'
  }>,
  { status: string }
>>()

// Multiple fields - mixed requirements
check<Equal<
  InferCreateType<{
    email: Field<string> & { required: true }
    name: Field<string>
    tags: Field<string[]>
  }>,
  {
    email: string
    name?: string
    tags?: string[]
  }
>>()

// All optional -> all optional in create
check<Equal<
  InferCreateType<{
    firstName: Field<string>
    lastName: Field<string>
    age: Field<number>
  }>,
  {
    firstName?: string
    lastName?: string
    age?: number
  }
>>()

// All required -> all required in create
check<Equal<
  InferCreateType<{
    title: Field<string> & { required: true }
    count: Field<number> & { required: true }
  }>,
  {
    title: string
    count: number
  }
>>()

// Empty fields -> empty object
check<Equal<
  InferCreateType<{}>,
  {}
>>()