/**
 * Posts API Route
 *
 * Provides REST API endpoints for the posts collection.
 * Demonstrates CRUD operations using @deessejs/collections in a Next.js API route.
 *
 * Endpoints:
 * - GET    /api/posts     - List all posts
 * - GET    /api/posts/:id - Get a single post by ID
 * - POST   /api/posts     - Create a new post
 * - PATCH  /api/posts/:id - Update a post
 * - DELETE /api/posts/:id - Delete a post
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

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
 * GET /api/posts
 * List all posts
 */
export async function GET() {
  try {
    const db = await getDb()
    const result = await db.posts.findMany()

    return Response.json(serializeValue(result))
  } catch (error) {
    console.error('GET /api/posts error:', error)
    return Response.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/posts
 * Create a new post
 * Body: { title: string, content?: string, published?: boolean, viewCount?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const db = await getDb()

    // create() returns the record directly, throws on error
    const result = await db.posts.create({ data: body })

    return Response.json(serializeValue(result), { status: 201 })
  } catch (error) {
    console.error('POST /api/posts error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    )
  }
}
