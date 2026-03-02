import { describe, it, expect } from 'vitest'
import { pgAdapter, type PgAdapter, type DatabaseAdapter } from '../src'

describe('pgAdapter', () => {
  it('creates a postgres adapter with url', () => {
    const adapter = pgAdapter({ url: 'postgres://user:pass@localhost:5432/db' })

    expect(adapter.type).toBe('postgres')
    expect(adapter.config.url).toBe('postgres://user:pass@localhost:5432/db')
  })

  it('creates adapter with default migrations path', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })

    expect(adapter.config.migrationsPath).toBe('./migrations')
  })

  it('creates adapter with custom migrations path', () => {
    const adapter = pgAdapter({
      url: 'postgres://localhost:5432/db',
      migrationsPath: './custom-migrations'
    })

    expect(adapter.config.migrationsPath).toBe('./custom-migrations')
  })

  it('has correct type', () => {
    const adapter = pgAdapter({ url: 'postgres://localhost:5432/db' })

    const _typeCheck: PgAdapter = adapter
    const _dbTypeCheck: DatabaseAdapter = adapter

    expect(_typeCheck).toBeDefined()
    expect(_dbTypeCheck).toBeDefined()
  })
})
