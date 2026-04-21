/**
 * Users by ID API Route
 *
 * Provides REST API endpoints for a single user by ID.
 * Works with the users collection.
 *
 * Endpoints:
 * - GET    /api/users/:id - Get a single user by ID
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

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const db = await getDb()

    const result = await db.users.findFirst({
      where: where((p) => [eq(p.id, id)]),
    })

    if (!result) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return Response.json(serializeValue(result))
  } catch (error) {
    console.error('GET /api/users/:id error:', error)
    return Response.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/users/:id
 * Update a user
 * Body: { name?: string, email?: string, bio?: string, active?: boolean }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const db = await getDb()

    const result = await db.users.update({
      where: where((p) => [eq(p.id, id)]),
      data: body,
    })

    return Response.json(serializeValue(result))
  } catch (error) {
    console.error('PATCH /api/users/:id error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/:id
 * Delete a user
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const db = await getDb()

    await db.users.delete({
      where: where((p) => [eq(p.id, id)]),
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/users/:id error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to delete user' },
      { status: 500 }
    )
  }
}
