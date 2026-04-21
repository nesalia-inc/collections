/**
 * Posts by ID API Route
 *
 * Provides REST API endpoints for a single post by ID.
 * Works with the posts collection.
 *
 * Endpoints:
 * - GET    /api/posts/:id - Get a single post by ID
 * - PATCH  /api/posts/:id - Update a post
 * - DELETE /api/posts/:id - Delete a post
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
 * GET /api/posts/:id
 * Get a single post by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const db = await getDb()

    const result = await db.posts.findFirst({
      where: where((p) => [eq(p.id, id)]),
    })

    if (!result) {
      return Response.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    return Response.json(serializeValue(result))
  } catch (error) {
    console.error('GET /api/posts/:id error:', error)
    return Response.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/posts/:id
 * Update a post
 * Body: { title?: string, content?: string, published?: boolean, viewCount?: number }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const db = await getDb()

    const result = await db.posts.update({
      where: where((p) => [eq(p.id, id)]),
      data: body,
    })

    return Response.json(serializeValue(result))
  } catch (error) {
    console.error('PATCH /api/posts/:id error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/posts/:id
 * Delete a post
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const db = await getDb()

    await db.posts.delete({
      where: where((p) => [eq(p.id, id)]),
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/posts/:id error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    )
  }
}
