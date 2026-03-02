import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'v8',
      exclude: [
        'tests/**',
        'vitest.config.ts',
        'src/migrations.ts',
        'src/operations/types.ts',
        'src/operations/collection-operations.ts',
        'src/schema.ts',
        'src/fields/f.ts'
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90
      }
    }
  }
})
