import { defineConfig } from 'tsup'

export default defineConfig([
  // Main library
  {
    entry: ['src/index.ts', 'src/next/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['pg', 'better-sqlite3', 'mysql2', 'drizzle-orm', 'drizzle-kit', 'next', 'react']
  },
  // CLI - CJS only for better compatibility
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    dts: false,
    sourcemap: true,
    outDir: './dist',
    external: ['pg', 'better-sqlite3', 'mysql2', 'drizzle-orm', 'drizzle-kit', 'next', 'react']
  },
  // Adapter modules
  {
    entry: [
      'src/adapter/core/index.ts',
      'src/adapter/postgresql/index.ts',
      'src/adapter/sqlite/index.ts',
      'src/adapter/crud/index.ts',
    ],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    outDir: './dist/adapter',
    external: ['pg', 'better-sqlite3', 'mysql2', 'drizzle-orm', 'drizzle-kit', 'next', 'react']
  }
])
