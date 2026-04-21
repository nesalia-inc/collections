/**
 * Init Command
 *
 * Initializes a new @deessejs/collections project with the specified template.
 */

import fs from 'node:fs'
import path from 'node:path'
import { error, attempt, ok, err, type Result } from '@deessejs/core'
import { z } from 'zod'

// ============================================================================
// Types
// ============================================================================

export interface InitOptions {
  /** Template name: minimal, todo, blog */
  template: 'minimal' | 'todo' | 'blog'
  /** Output directory path */
  out: string
}

export type InitErrorType = ReturnType<typeof InitError>

const InitError = error({
  name: 'InitError',
  schema: z.object({
    reason: z.enum(['directory_exists', 'write_failed', 'unknown']),
    message: z.string(),
  }),
  message: (args) => args.message,
})

// ============================================================================
// Template Definitions
// ============================================================================

interface TemplateFile {
  path: string
  content: string
}

interface TemplateDefinition {
  name: string
  description: string
  files: TemplateFile[]
}

const minimalTemplate = `
import { defineCollections, collection, field, f, postgres } from '@deessejs/collections'

export default defineCollections({
  db: postgres({ connectionString: process.env.DATABASE_URL! }),
  collections: [
    collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text(), required: true }),
        content: field({ fieldType: f.text() }),
      },
    }),
  ],
})
`

const todoTemplate = `
import { defineCollections, collection, field, f, postgres } from '@deessejs/collections'

export default defineCollections({
  db: postgres({ connectionString: process.env.DATABASE_URL! }),
  collections: [
    collection({
      slug: 'tasks',
      fields: {
        title: field({ fieldType: f.text(), required: true }),
        completed: field({ fieldType: f.boolean(), defaultValue: false }),
        dueDate: field({ fieldType: f.datetime() }),
      },
    }),
  ],
})
`

const blogTemplate = `
import { defineCollections, collection, field, f, postgres } from '@deessejs/collections'

export default defineCollections({
  db: postgres({ connectionString: process.env.DATABASE_URL! }),
  collections: [
    collection({
      slug: 'users',
      fields: {
        name: field({ fieldType: f.text(), required: true }),
        email: field({ fieldType: f.email(), required: true }),
      },
    }),
    collection({
      slug: 'posts',
      fields: {
        title: field({ fieldType: f.text(), required: true }),
        content: field({ fieldType: f.richtext() }),
        published: field({ fieldType: f.boolean(), defaultValue: false }),
        authorId: field({ fieldType: f.text(), required: true }),
      },
    }),
    collection({
      slug: 'comments',
      fields: {
        content: field({ fieldType: f.text(), required: true }),
        postId: field({ fieldType: f.text(), required: true }),
        authorId: field({ fieldType: f.text(), required: true }),
      },
    }),
  ],
})
`

const packageJson = `{
  "name": "my-collections-project",
  "version": "1.0.0",
  "description": "Project initialized with @deessejs/collections",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "test": "vitest run"
  },
  "dependencies": {
    "@deessejs/collections": "^0.2.1",
    "dotenv": "^16.4.0",
    "drizzle-orm": "^0.45.0",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "@types/node": "^20.14.12",
    "@types/pg": "^8.11.0",
    "drizzle-kit": "^0.31.0",
    "eslint": "^8.57.0",
    "tsx": "^4.21.0",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
`

const seedScript = `
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { createSqliteSchema } from '@deessejs/collections/adapter/sqlite'
import { createCollections } from '@deessejs/collections/runtime'
import type { Collection } from '@deessejs/collections'
import { collection, field, f } from '@deessejs/collections'

// Define your collections here
const tasks = collection({
  slug: 'tasks',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    completed: field({ fieldType: f.boolean(), defaultValue: false }),
  },
})

const collections: Collection[] = [tasks]

async function seed() {
  console.log('Starting database seed...')

  // Set up SQLite in-memory database for seeding
  const sqliteDb = new Database(':memory:')
  const db = drizzle(sqliteDb, { schema: createSqliteSchema(collections) })

  // Create collections instance
  const result = createCollections({
    collections,
    db: { type: 'sqlite', connection: sqliteDb },
  })

  if (!result.ok) {
    console.error('Failed to create collections:', result.error)
    process.exit(1)
  }

  const { db: dbAccess } = result.value

  // Seed data
  console.log('Seeding tasks...')
  const task1 = await dbAccess.tasks.create({
    data: { title: 'Learn @deessejs/collections', completed: true },
  })

  const task2 = await dbAccess.tasks.create({
    data: { title: 'Build your first collection', completed: false },
  })

  console.log('Created tasks:', { task1, task2 })

  const allTasks = await dbAccess.tasks.findMany()
  console.log('All tasks:', allTasks)

  console.log('Seed complete!')
}

seed().catch(console.error)
`

const gitkeep = ''

const drizzleConfig = `
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/**/*.ts',
  out: './drizzle',
  verbose: true,
  strict: true,
})
`

const tsconfig = `
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": false,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true
  },
  "include": ["src/**/*", "collection.config.ts"],
  "exclude": ["node_modules", "dist"]
}
`

const envExample = `
# Database connection string
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
`

// ============================================================================
// File Creation Helpers
// ============================================================================

const writeFile = (filePath: string, content: string): Result<void, InitErrorType> => {
  const dir = path.dirname(filePath)
  const dirResult = attempt(() => fs.mkdirSync(dir, { recursive: true }))
  if (!dirResult.ok) {
    return err(InitError({ reason: 'write_failed', message: `Failed to create directory: ${dir}` }))
  }

  const writeResult = attempt(() => {
    if (content.length > 0) {
      fs.writeFileSync(filePath, content, 'utf-8')
    } else {
      fs.writeFileSync(filePath, '', 'utf-8')
    }
  })
  if (!writeResult.ok) {
    return err(InitError({ reason: 'write_failed', message: `Failed to write file: ${filePath}` }))
  }

  return ok(undefined)
}

// ============================================================================
// Template Registry
// ============================================================================

const templates: Record<InitOptions['template'], TemplateDefinition> = {
  minimal: {
    name: 'Minimal',
    description: 'Basic collection.config.ts with one example collection',
    files: [
      { path: 'collection.config.ts', content: minimalTemplate.trim() },
      { path: 'src/collections/.gitkeep', content: gitkeep },
      { path: 'drizzle/.gitkeep', content: gitkeep },
      { path: 'scripts/seed.ts', content: seedScript.trim() },
      { path: 'package.json', content: packageJson.trim() },
      { path: 'tsconfig.json', content: tsconfig.trim() },
      { path: 'drizzle.config.ts', content: drizzleConfig.trim() },
      { path: '.env.example', content: envExample.trim() },
    ],
  },
  todo: {
    name: 'Todo',
    description: 'Todo app example with tasks and completion status',
    files: [
      { path: 'collection.config.ts', content: todoTemplate.trim() },
      { path: 'src/collections/.gitkeep', content: gitkeep },
      { path: 'drizzle/.gitkeep', content: gitkeep },
      { path: 'scripts/seed.ts', content: seedScript.trim() },
      { path: 'package.json', content: packageJson.trim() },
      { path: 'tsconfig.json', content: tsconfig.trim() },
      { path: 'drizzle.config.ts', content: drizzleConfig.trim() },
      { path: '.env.example', content: envExample.trim() },
    ],
  },
  blog: {
    name: 'Blog',
    description: 'Blog example with posts, users, and comments',
    files: [
      { path: 'collection.config.ts', content: blogTemplate.trim() },
      { path: 'src/collections/.gitkeep', content: gitkeep },
      { path: 'drizzle/.gitkeep', content: gitkeep },
      { path: 'scripts/seed.ts', content: seedScript.trim() },
      { path: 'package.json', content: packageJson.trim() },
      { path: 'tsconfig.json', content: tsconfig.trim() },
      { path: 'drizzle.config.ts', content: drizzleConfig.trim() },
      { path: '.env.example', content: envExample.trim() },
    ],
  },
}

// ============================================================================
// Init Command Implementation
// ============================================================================

export const initCommand = (options: InitOptions): Result<void, InitErrorType> => {
  const { template, out } = options
  const templateDef = templates[template]

  if (!templateDef) {
    return err(InitError({ reason: 'unknown', message: `Unknown template: ${template}` }))
  }

  // Check if directory already exists
  const existsResult = attempt(() => fs.existsSync(out))
  if (!existsResult.ok) {
    return err(InitError({ reason: 'unknown', message: 'Failed to check directory existence' }))
  }

  if (existsResult.value) {
    return err(
      InitError({
        reason: 'directory_exists',
        message: `Directory "${out}" already exists. Please choose a different directory or remove the existing one.`,
      })
    )
  }

  // Create all files from template
  for (const file of templateDef.files) {
    const filePath = path.join(out, file.path)
    const writeResult = writeFile(filePath, file.content)
    if (!writeResult.ok) {
      return writeResult
    }
  }

  return ok(undefined)
}

export const AVAILABLE_TEMPLATES = [
  { name: 'minimal', description: 'Basic collection.config.ts with one example collection' },
  { name: 'todo', description: 'Todo app example (tasks with completion status)' },
  { name: 'blog', description: 'Blog example (posts, users, comments)' },
] as const
