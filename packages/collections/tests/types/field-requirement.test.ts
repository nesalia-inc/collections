// Field requirement compile-time tests
// Tests that required vs optional is correctly handled for both create and read

import { check, Equal } from '@deessejs/type-testing'
import type { Field } from '../../src/fields'
import type { InferCreateType } from '../../src/operations/database/types'
import type { GetCollectionType } from '../../src/collections/types'
import type { Collection } from '../../src/collections'

/**
 * These tests verify that field requirements are correctly translated:
 * - Create: required fields are mandatory, optional fields have `?`
 * - Read: all fields may be undefined (since DB can return null)
 */

// Required string field
type RequiredStringField = Field<string> & { required: true }
check<Equal<
  InferCreateType<{ email: RequiredStringField }>,
  { email: string }
>>()

// Optional string field (no required, no default)
type OptionalStringField = Field<string>
check<Equal<
  InferCreateType<{ email: OptionalStringField }>,
  { email?: string }
>>()

// Required with defaultValue still required (defaultValue doesn't make it optional for create)
// The field has required: true, so it's mandatory
check<Equal<
  InferCreateType<{
    status: Field<string> & { required: true, defaultValue: () => 'draft' }
  }>,
  { status: string }
>>()

// Optional with defaultValue - still optional (required is false)
check<Equal<
  InferCreateType<{
    category: Field<string> & { defaultValue: () => 'general' }
  }>,
  { category?: string }
>>()

// Read type handling (GetCollectionType)
// Required fields in collection definition become required in read type
check<Equal<
  GetCollectionType<Collection<'users', { name: Field<string> & { required: true } }>>,
  { name: string }
>>()

// Optional fields become optional in read type
check<Equal<
  GetCollectionType<Collection<'users', { bio: Field<string> }>>,
  { bio?: string }
>>()

// Complex scenario: multiple fields with different requirement configs
check<Equal<
  InferCreateType<{
    // Required: must provide
    title: Field<string> & { required: true }
    // Optional: can omit
    description: Field<string>
    // Optional with default: effectively required (omitting uses default)
    category: Field<string> & { defaultValue: () => 'uncategorized' }
    // Required with default: must provide
    priority: Field<number> & { required: true, defaultValue: () => 0 }
  }>,
  {
    title: string
    description?: string
    category?: string
    priority: number
  }
>>()