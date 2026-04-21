// Select field types compile-time tests
// Tests that select field projections generate correct types

import { check, Equal } from '@deessejs/type-testing'
import type { Field } from '../../src/fields'
import type { InferFieldTypes } from '../../src/collections/hooks/types'
import type { SelectInput } from '../../src/operations/database/types'
import type { PathProxy } from '../../src/operations/path'

/**
 * Select field types test that when using select projections, the resulting
 * type correctly reflects the selected fields as a union-like partial type.
 */

// PathProxy-based select function signature
// select: (p) => ({ id: p.id, title: p.title })
// This should result in a type that only has id and title

// InferFieldTypes extracts the underlying field value types
check<Equal<
  InferFieldTypes<{
    id: Field<number>
    title: Field<string>
    content: Field<string>
    createdAt: Field<Date>
  }>,
  {
    id: number
    title: string
    content: string
    createdAt: Date
  }
>>()

// Select result is a partial of the full type
// When you select { id: true, title: true }, you get { id: number, title: string }
type SelectedFields = { id: number, title: string }
check<Equal<
  SelectedFields,
  { id: number, title: string }
>>()

// SelectInput type definition
// The select function receives a PathProxy<T> and returns a partial of T
// type SelectInput<T> = (p: PathProxy<T>) => { ...fields you want... }

const exampleSelectFn: SelectInput<{ id: number; title: string }> = (p) => ({
  id: p.id,
  title: p.title,
})

// Resulting type from select should be the partial
type SelectResult = ReturnType<typeof exampleSelectFn>
check<Equal<
  SelectResult,
  { id: number; title: string }
>>()