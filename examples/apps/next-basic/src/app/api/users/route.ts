/**
 * Users API Route
 *
 * Provides REST API endpoints for the users collection.
 * Demonstrates CRUD operations using @deessejs/collections in a Next.js API route.
 *
 * Endpoints:
 * - GET    /api/users     - List all users
 * - GET    /api/users/:id - Get a single user by ID
 * - POST   /api/users     - Create a new user
 * - PATCH  /api/users/:id - Update a user
 * - DELETE /api/users/:id - Delete a user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { where, eq } from '@deessejs/collections'

/**
 * Serialize a value to JSON, handling special types like BigInt, Date, etc.
 */
function serializeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (Array.isArray(value)) {
    return value.map(serializeValue)
  }
  if (typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value)) {
      result[key] = serializeValue(val)
    }
    return result
  }
  return value
}

/**
 * GET /api/users
 * List all users or filter by query parameters
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb()
    const result = await db.users.findMany()

    return Response.json(serializeValue(result))
  } catch (error) {
    console.error('GET /api/users error:', error)
    return Response.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users
 * Create a new user
 * Body: { name: string, email: string, bio?: string, active?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = await getDb()

    // create() returns the record directly, throws on error
    const result = await db.users.create({ data: body })

    return Response.json(serializeValue(result), { status: 201 })
  } catch (error) {
    console.error('POST /api/users error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create user' },
      { status: 500 }
    )
  }
}
