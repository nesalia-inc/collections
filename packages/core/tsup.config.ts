import { defineConfig } from 'tsup'

export default defineConfig([
  // Main library
  {
    entry: ['src/index.ts', 'src/next/index.ts'],
    format: ['cjs', 'esm'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['pg', 'drizzle-orm', 'drizzle-kit', 'next', 'react']
  },
  // CLI - CJS only for better compatibility
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    dts: false,
    sourcemap: true,
    outDir: './dist',
    external: ['pg', 'drizzle-orm', 'drizzle-kit', 'next', 'react']
  }
])
