import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@deessejs/core': path.resolve(__dirname, '../../node_modules/@deessejs/core')
    }
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/integration/**', 'tests/types/**'],
    coverage: {
      reporter: ['text', 'json', 'html', 'json-summary'],
      provider: 'v8',
      reportsDirectory: '../../coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'tests/**',
        'vitest.config.ts',
        'src/migrations.ts',
        'src/cli.ts',
        'src/operations/types.ts',
        'src/operations/collection-operations.ts',
        'src/schema.ts',
        'src/fields/f.ts',
        'src/fields/types.ts',
        'src/next/**',
        'src/config.ts'
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
