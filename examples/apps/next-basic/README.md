# @deessejs/collections + Next.js Demo

This is a template demonstrating how to use [@deessejs/collections](https://github.com/deessejs/collections) with Next.js and PostgreSQL.

## Features

- **Collections DSL** - Define data models with `collection()`, `field()`, and `f()` helpers
- **PostgreSQL adapter** - Uses Drizzle ORM under the hood
- **Server Components** - Database access in React Server Components
- **REST API routes** - Full CRUD API endpoints for each collection
- **Type safety** - End-to-end TypeScript with inference

## Collections

This demo includes two collections:

### Users
- `name` (text, required)
- `email` (email, required)
- `bio` (text, optional)
- `active` (boolean, default: true)

### Posts
- `title` (text, required)
- `content` (text, optional)
- `published` (boolean, default: false)
- `viewCount` (number, default: 0)

## Setup

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and set your DATABASE_URL
   ```

3. **Push schema to database** (requires CLI)
   ```bash
   npx @deessejs/collections push
   ```

4. **Start development server**
   ```bash
   pnpm dev
   ```

## API Endpoints

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/[id]` | Get user by ID |
| POST | `/api/users` | Create user |
| PATCH | `/api/users/[id]` | Update user |
| DELETE | `/api/users/[id]` | Delete user |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List all posts |
| GET | `/api/posts/[id]` | Get post by ID |
| POST | `/api/posts` | Create post |
| PATCH | `/api/posts/[id]` | Update post |
| DELETE | `/api/posts/[id]` | Delete post |

## Key Concepts

### Database Singleton (`src/lib/db.ts`)
Uses a singleton pattern to ensure a single PostgreSQL connection pool across the Next.js app lifetime.

### Server Components
The main page (`src/app/page.tsx`) uses a Server Component to fetch and display data, showing how collections integrate with Next.js App Router.

### Result Types
Uses `@deessejs/core` Result types (`isOk`, `isErr`) for error handling instead of try-catch where appropriate.

## Learn More

- [@deessejs/collections Documentation](https://github.com/deessejs/collections)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Next.js App Router](https://nextjs.org/docs/app)
