/**
 * Collections Demo Page
 *
 * This page demonstrates @deessejs/collections integration with Next.js.
 * It shows how to use database-backed collections in Server Components.
 *
 * Key concepts demonstrated:
 * - Server Components for data fetching
 * - Type-safe database operations via getDb()
 * - Client Components for interactive forms
 */

import { getDb } from '@/lib/db'
import type { UserRecord, PostRecord } from '@/collections'
import { CreateUserForm } from '@/components/CreateUserForm'
import { CreatePostForm } from '@/components/CreatePostForm'
import { DeleteButton } from '@/components/DeleteButton'

/**
 * User Card Component
 */
async function UserCard({ user }: { user: UserRecord }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{user.name}</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{user.email}</p>
          {user.bio && (
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{user.bio}</p>
          )}
        </div>
        <DeleteButton
          id={(user as { id: string | number }).id}
          name={user.name}
          endpoint="users"
        />
      </div>
      <div className="mt-2">
        <span
          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
            user.active
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
          }`}
        >
          {user.active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}

/**
 * Post Card Component
 */
async function PostCard({ post }: { post: PostRecord }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{post.title}</h3>
          {post.content && (
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3">
              {post.content}
            </p>
          )}
        </div>
        <DeleteButton
          id={(post as { id: string | number }).id}
          name={post.title}
          endpoint="posts"
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span
          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
            post.published
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
          }`}
        >
          {post.published ? 'Published' : 'Draft'}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-500">
          {post.viewCount?.toLocaleString() ?? 0} views
        </span>
      </div>
    </div>
  )
}

/**
 * Main Demo Page
 *
 * This Server Component fetches data from the database and renders it.
 * Data fetching happens on the server - no client-side API calls needed.
 */
export default async function Home() {
  let usersResult: UserRecord[] = []
  let postsResult: PostRecord[] = []
  let dbError: string | null = null

  try {
    const db = await getDb()

    // Fetch users - findMany returns array directly, not Result
    const users = await db.users.findMany()
    usersResult = users as UserRecord[]

    // Fetch posts
    const posts = await db.posts.findMany()
    postsResult = posts as PostRecord[]
  } catch (error) {
    dbError = error instanceof Error ? error.message : 'Database connection failed'
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="bg-white px-6 py-8 dark:bg-black">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            @deessejs/collections + Next.js
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Demonstrating database-backed collections with PostgreSQL
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-zinc-50 px-6 py-8 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Database Status */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Database Status
            </h2>
            {dbError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <strong>Error:</strong> {dbError}
                </p>
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  Make sure DATABASE_URL is configured in your .env file.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                <p className="text-sm text-green-800 dark:text-green-200">
                  Connected to PostgreSQL database
                </p>
              </div>
            )}
          </section>

          {/* Users Section */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Users ({usersResult.length})
              </h2>
              <CreateUserForm />
            </div>
            {usersResult.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {usersResult.map((user) => (
                  <UserCard key={(user as { id?: string }).id} user={user} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">No users yet</p>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600">
                  Create your first user using the button above
                </p>
              </div>
            )}
          </section>

          {/* Posts Section */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Posts ({postsResult.length})
              </h2>
              <CreatePostForm />
            </div>
            {postsResult.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {postsResult.map((post) => (
                  <PostCard key={(post as { id?: string }).id} post={post} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                <p className="text-zinc-500 dark:text-zinc-400">No posts yet</p>
                <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600">
                  Create your first post using the button above
                </p>
              </div>
            )}
          </section>

          {/* API Reference */}
          <section className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-700">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              API Endpoints
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-medium text-zinc-800 dark:text-zinc-200">Users</h3>
                <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <li><code className="text-zinc-800 dark:text-zinc-200">GET /api/users</code> - List all</li>
                  <li><code className="text-zinc-800 dark:text-zinc-200">GET /api/users/[id]</code> - Get one</li>
                  <li><code className="text-zinc-800 dark:text-zinc-200">POST /api/users</code> - Create</li>
                  <li><code className="text-zinc-800 dark:text-zinc-200">PATCH /api/users/[id]</code> - Update</li>
                  <li><code className="text-zinc-800 dark:text-zinc-200">DELETE /api/users/[id]</code> - Delete</li>
                </ul>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-zinc-800 dark:text-zinc-200">Posts</h3>
                <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <li><code className="text-zinc-800 dark:text-zinc-200">GET /api/posts</code> - List all</li>
                  <li><code className="text-zinc-800 dark:text-zinc-200">GET /api/posts/[id]</code> - Get one</li>
                  <li><code className="text-zinc-800 dark:text-zinc-200">POST /api/posts</code> - Create</li>
                  <li><code className="text-zinc-800 dark:text-zinc-200">PATCH /api/posts/[id]</code> - Update</li>
                  <li><code className="text-zinc-800 dark:text-zinc-200">DELETE /api/posts/[id]</code> - Delete</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
