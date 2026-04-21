import { describe, it, expect } from 'vitest'
import { buildDrizzleTable } from '../../../src/adapter/sqlite'
import type { RawTable } from '../../../src/adapter/core/types'

describe('buildDrizzleTable', () => {
  describe('boolean columns', () => {
    it('should build boolean column without constraints', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          is_active: { type: 'boolean', name: 'is_active' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table).toBeDefined()
      expect(table.is_active).toBeDefined()
    })

    it('should build boolean column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          is_active: { type: 'boolean', name: 'is_active', notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.is_active).toBeDefined()
    })

    it('should build boolean column with default value', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          is_active: { type: 'boolean', name: 'is_active', default: false },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.is_active).toBeDefined()
    })

    it('should build boolean column as primary key', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          is_primary: { type: 'boolean', name: 'is_primary', primaryKey: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.is_primary).toBeDefined()
    })
  })

  describe('integer columns', () => {
    it('should build integer column without constraints', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          age: { type: 'integer', name: 'age' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.age).toBeDefined()
    })

    it('should build integer column with autoincrement', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          counter: { type: 'integer', name: 'counter', autoIncrement: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.counter).toBeDefined()
    })

    it('should build integer column with default value', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          priority: { type: 'integer', name: 'priority', default: 1 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.priority).toBeDefined()
    })

    it('should build integer column with notNull and default', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          score: { type: 'integer', name: 'score', notNull: true, default: 0 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.score).toBeDefined()
    })
  })

  describe('serial columns', () => {
    it('should build serial column with autoincrement', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          id: { type: 'serial', name: 'id', primaryKey: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.id).toBeDefined()
    })

    it('should build serial column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          id: { type: 'serial', name: 'id', notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.id).toBeDefined()
    })
  })

  describe('text columns (SQLite uses text() for varchar and char)', () => {
    it('should build text column without constraints', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          content: { type: 'text', name: 'content' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.content).toBeDefined()
    })

    it('should build text column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          description: { type: 'text', name: 'description', notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.description).toBeDefined()
    })

    it('should build varchar column (maps to text in SQLite)', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          title: { type: 'varchar', name: 'title', length: 255, notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.title).toBeDefined()
    })

    it('should build char column (maps to text in SQLite)', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          code: { type: 'char', name: 'code', length: 3 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.code).toBeDefined()
    })
  })

  describe('uuid columns (SQLite uses text() for uuid)', () => {
    it('should build uuid column without constraints', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          id: { type: 'uuid', name: 'id' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.id).toBeDefined()
    })

    it('should build uuid column as primary key with defaultRandom', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.id).toBeDefined()
    })

    it('should build uuid column with foreign key reference', () => {
      const usersTable: RawTable = {
        name: 'users',
        columns: {
          id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
        },
      }

      const { table: users } = buildDrizzleTable(usersTable)

      const postsTable: RawTable = {
        name: 'posts',
        columns: {
          author_id: {
            type: 'uuid',
            name: 'author_id',
            notNull: true,
            reference: { name: 'id', table: 'users', onDelete: 'cascade' },
          },
        },
      }

      const { table: posts } = buildDrizzleTable(postsTable, { users })
      expect(posts.author_id).toBeDefined()
    })
  })

  describe('date and timestamp columns (SQLite uses integer for Unix timestamps)', () => {
    it('should build date column as integer', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          birthday: { type: 'date', name: 'birthday' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.birthday).toBeDefined()
    })

    it('should build date column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          event_date: { type: 'date', name: 'event_date', notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.event_date).toBeDefined()
    })

    it('should build timestamp column as integer', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          created_at: { type: 'timestamp', name: 'created_at' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.created_at).toBeDefined()
    })

    it('should build timestamp column with defaultNow', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          created_at: { type: 'timestamp', name: 'created_at', defaultNow: true, notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.created_at).toBeDefined()
    })

    it('should build timestamptz column as integer (no timezone support)', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          updated_at: { type: 'timestamptz', name: 'updated_at' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.updated_at).toBeDefined()
    })
  })

  describe('json columns (SQLite uses text for json/jsonb)', () => {
    it('should build json column as text', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          metadata: { type: 'json', name: 'metadata' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.metadata).toBeDefined()
    })

    it('should build jsonb column as text (no binary jsonb in SQLite)', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          data: { type: 'jsonb', name: 'data' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.data).toBeDefined()
    })

    it('should build json column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          config: { type: 'json', name: 'config', notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.config).toBeDefined()
    })
  })

  describe('numeric and decimal columns (SQLite uses real())', () => {
    it('should build numeric column as real', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          price: { type: 'numeric', name: 'price', precision: 10, scale: 2 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.price).toBeDefined()
    })

    it('should build decimal column as real', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          balance: { type: 'decimal', name: 'balance', precision: 12, scale: 2 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.balance).toBeDefined()
    })
  })

  describe('real columns', () => {
    it('should build real column', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          weight: { type: 'real', name: 'weight' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.weight).toBeDefined()
    })

    it('should build real column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          temperature: { type: 'real', name: 'temperature', notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.temperature).toBeDefined()
    })
  })

  describe('enum columns (SQLite uses text())', () => {
    it('should build enum column as text', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          status: {
            type: 'enum',
            name: 'status',
            enumName: 'post_status',
            options: ['draft', 'published', 'archived'],
          },
        },
      }

      const { table, enums } = buildDrizzleTable(rawTable)
      expect(table.status).toBeDefined()
      // SQLite doesn't have native enum support, so enums should be empty
      expect(Object.keys(enums)).toHaveLength(0)
    })

    it('should build enum column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          category: {
            type: 'enum',
            name: 'category',
            enumName: 'category_type',
            options: ['news', 'opinion', 'review'],
            notNull: true,
          },
        },
      }

      const { table, enums } = buildDrizzleTable(rawTable)
      expect(table.category).toBeDefined()
      expect(Object.keys(enums)).toHaveLength(0)
    })
  })

  describe('PostgreSQL-only types (should throw errors)', () => {
    it('should throw error for vector type', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          embedding: { type: 'vector', name: 'embedding' },
        },
      }

      expect(() => buildDrizzleTable(rawTable)).toThrow('Type "vector" is not supported in SQLite adapter')
    })

    it('should throw error for halfvec type', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          embedding: { type: 'halfvec', name: 'embedding' },
        },
      }

      expect(() => buildDrizzleTable(rawTable)).toThrow('Type "halfvec" is not supported in SQLite adapter')
    })

    it('should throw error for sparsevec type', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          embedding: { type: 'sparsevec', name: 'embedding' },
        },
      }

      expect(() => buildDrizzleTable(rawTable)).toThrow('Type "sparsevec" is not supported in SQLite adapter')
    })

    it('should throw error for bit type', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          flags: { type: 'bit', name: 'flags' },
        },
      }

      expect(() => buildDrizzleTable(rawTable)).toThrow('Type "bit" is not supported in SQLite adapter')
    })
  })

  describe('indexes', () => {
    it('should build table with simple index', () => {
      const rawTable: RawTable = {
        name: 'posts',
        columns: {
          title: { type: 'text', name: 'title' },
        },
        indexes: {
          title_idx: { name: 'title_idx', on: 'title' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table).toBeDefined()
    })

    it('should build table with unique index', () => {
      const rawTable: RawTable = {
        name: 'users',
        columns: {
          email: { type: 'text', name: 'email' },
        },
        indexes: {
          email_unique: { name: 'email_unique', on: 'email', unique: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table).toBeDefined()
    })

    it('should build table with composite index', () => {
      const rawTable: RawTable = {
        name: 'posts',
        columns: {
          author_id: { type: 'uuid', name: 'author_id' },
          title: { type: 'text', name: 'title' },
        },
        indexes: {
          author_title_idx: {
            name: 'author_title_idx',
            on: ['author_id', 'title'],
          },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table).toBeDefined()
    })
  })

  describe('foreign keys', () => {
    it('should build table with foreign key', () => {
      const usersTable: RawTable = {
        name: 'users',
        columns: {
          id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
        },
      }

      const { table: users } = buildDrizzleTable(usersTable)

      const postsTable: RawTable = {
        name: 'posts',
        columns: {
          author_id: { type: 'uuid', name: 'author_id', notNull: true },
        },
        foreignKeys: {
          author_fk: {
            name: 'author_fk',
            columns: ['author_id'],
            foreignColumns: [{ name: 'id', table: 'users' }],
            onDelete: 'cascade',
          },
        },
      }

      const { table: posts } = buildDrizzleTable(postsTable, { users })
      expect(posts).toBeDefined()
    })
  })

  describe('complete table definitions', () => {
    it('should build a complete posts table', () => {
      const rawTable: RawTable = {
        name: 'posts',
        columns: {
          id: { type: 'integer', name: 'id', primaryKey: true, autoIncrement: true },
          author_id: {
            type: 'uuid',
            name: 'author_id',
            notNull: true,
            reference: { name: 'id', table: 'users', onDelete: 'cascade' },
          },
          title: { type: 'text', name: 'title', notNull: true },
          slug: { type: 'text', name: 'slug', notNull: true },
          content: { type: 'text', name: 'content' },
          published: { type: 'boolean', name: 'published', default: false },
          view_count: { type: 'integer', name: 'view_count', default: 0 },
          created_at: { type: 'integer', name: 'created_at', notNull: true },
          updated_at: { type: 'integer', name: 'updated_at', notNull: true },
          metadata: { type: 'text', name: 'metadata' },
        },
        indexes: {
          title_idx: { name: 'title_idx', on: 'title' },
          slug_unique: { name: 'slug_unique', on: 'slug', unique: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table).toBeDefined()
      expect(table.id).toBeDefined()
      expect(table.title).toBeDefined()
      expect(table.slug).toBeDefined()
      expect(table.content).toBeDefined()
      expect(table.published).toBeDefined()
      expect(table.view_count).toBeDefined()
      expect(table.created_at).toBeDefined()
      expect(table.updated_at).toBeDefined()
      expect(table.metadata).toBeDefined()
    })

    it('should build a complete users table with enum', () => {
      const rawTable: RawTable = {
        name: 'users',
        columns: {
          id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
          email: { type: 'text', name: 'email', notNull: true },
          username: { type: 'text', name: 'username' },
          role: {
            type: 'enum',
            name: 'role',
            enumName: 'user_role',
            options: ['admin', 'editor', 'viewer'],
            notNull: true,
            default: 'viewer',
          },
          is_active: { type: 'boolean', name: 'is_active', default: true },
          balance: { type: 'real', name: 'balance' },
          created_at: { type: 'integer', name: 'created_at', notNull: true },
        },
      }

      const { table, enums } = buildDrizzleTable(rawTable)
      expect(table).toBeDefined()
      expect(table.email).toBeDefined()
      expect(table.role).toBeDefined()
      // SQLite enums are always empty
      expect(Object.keys(enums)).toHaveLength(0)
    })
  })

  describe('error handling', () => {
    it('should return empty enums object for SQLite', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          name: { type: 'text', name: 'name' },
        },
      }

      const { enums } = buildDrizzleTable(rawTable)
      expect(enums).toBeDefined()
      expect(typeof enums).toBe('object')
      expect(Object.keys(enums)).toHaveLength(0)
    })
  })
})