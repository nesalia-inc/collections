# Views

Views are predefined queries that appear as collections but don't have their own database table. They provide dedicated API endpoints, type safety, and granular permissions.

## Why Views?

A filter function does the same job technically:

```typescript
// Filter function
db.posts.find({
  where: (p) => p.status.eq('published')
})
```

But a View offers:

- **Dedicated API endpoint** - `/published-posts` instead of `/posts?status=published`
- **Different permissions** - Public access to view, admin-only for main collection
- **Type-specific response** - `PublishedPost[]` vs `Post[]`
- **Admin UI** - Appears as a separate resource

## Definition

```typescript
const publishedPosts = view({
  from: 'posts',

  // Optional: custom slug for API endpoint
  slug: 'published-posts',

  // Optional: predefined filters
  where: (p) => p.status.eq('published'),

  // Optional: default ordering
  orderBy: (p) => p.createdAt.desc(),

  // Optional: default limit
  limit: 10
})
```

## Access Control

Views enable granular permissions:

```typescript
const publicAuthors = view({
  from: 'users',

  // Only expose specific fields
  select: {
    id: true,
    name: true,
    avatar: true
  },

  // Filter by role
  where: (u) => u.role.eq('author'),

  // Public can read
  access: {
    read: () => true,
    // No write access
  }
})
```

This is powerful because:
- Main `users` collection stays private (admin only)
- `publicAuthors` exposes safe, read-only data
- Role-based filtering happens at the database level

## Type Safety

TypeScript infers the type from the view:

```typescript
type PublicAuthor = GetCollectionType<typeof publicAuthors>
// {
//   id: string
//   name: string
//   avatar: string | null
// }

const authors = await db.publicAuthors.findMany()
// authors is typed as PublicAuthor[]
```

## Comparison with Filters

| Aspect | Filter | View |
|--------|--------|------|
| API | `GET /posts?status=published` | `GET /published-posts` |
| Permissions | Same as parent | Custom per view |
| Type | `Post[]` | `PublishedPost[]` |
| Admin UI | Filter tab | Dedicated menu item |

## Use Cases

### 1. Public vs Admin Resources
```typescript
const publishedPosts = view({
  from: 'posts',
  where: (p) => p.status.eq('published'),
  access: { read: () => true }
})

const allPosts = collection({
  slug: 'posts',
  access: { read: () => isAdmin() }
})
```

### 2. Top N Queries
```typescript
const topProducts = view({
  from: 'products',
  orderBy: (p) => p.sales.desc(),
  limit: 50
})
```

### 3. Dashboard Data
```typescript
const userDashboard = view({
  from: 'users',
  select: {
    id: true,
    name: true,
    posts: { select: { title: true } },
    orders: { select: { total: true } }
  }
})
```

## SQL Implementation

Views can be implemented as SQL Views:

```typescript
const publishedPosts = view({
  from: 'posts',
  where: (p) => p.status.eq('published'),

  // Create as SQL VIEW (not a table)
  implementation: 'view'
})
```

This generates:
```sql
CREATE VIEW published_posts AS
SELECT * FROM posts WHERE status = 'published';
```

Benefits:
- Database optimizes query execution
- No data duplication
- Always up-to-date
