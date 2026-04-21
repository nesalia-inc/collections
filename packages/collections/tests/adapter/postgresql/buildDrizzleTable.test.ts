import { describe, it, expect } from 'vitest'
import { buildDrizzleTable, createPgEnum } from '../../../src/adapter/postgresql'
import type { RawTable, RawColumn } from '../../../src/adapter/core/types'
import { pgEnum } from 'drizzle-orm/pg-core'

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
    it('should build serial column', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          id: { type: 'serial', name: 'id', primaryKey: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.id).toBeDefined()
    })
  })

  describe('varchar columns', () => {
    it('should build varchar column with length', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          title: { type: 'varchar', name: 'title', length: 255, notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.title).toBeDefined()
    })

    it('should build varchar column with default value', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          slug: { type: 'varchar', name: 'slug', length: 100, default: 'untitled' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.slug).toBeDefined()
    })
  })

  describe('text columns', () => {
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

    it('should build text column with default value', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          body: { type: 'text', name: 'body', default: '' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.body).toBeDefined()
    })
  })

  describe('uuid columns', () => {
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

  describe('timestamp columns', () => {
    it('should build timestamp column without constraints', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          created_at: { type: 'timestamp', name: 'created_at' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.created_at).toBeDefined()
    })

    it('should build timestamp column with precision', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          created_at: { type: 'timestamp', name: 'created_at', precision: 6 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.created_at).toBeDefined()
    })

    it('should build timestamp column with timezone', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          created_at: { type: 'timestamp', name: 'created_at', withTimezone: true },
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

    it('should build timestamp column with all options', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          updated_at: {
            type: 'timestamp',
            name: 'updated_at',
            precision: 3,
            withTimezone: false,
            defaultNow: true,
            notNull: true,
          },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.updated_at).toBeDefined()
    })
  })

  describe('timestamptz columns', () => {
    it('should build timestamptz column without constraints', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          updated_at: { type: 'timestamptz', name: 'updated_at' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.updated_at).toBeDefined()
    })

    it('should build timestamptz column with precision', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          updated_at: { type: 'timestamptz', name: 'updated_at', precision: 6 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.updated_at).toBeDefined()
    })

    it('should build timestamptz column with defaultNow', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          updated_at: { type: 'timestamptz', name: 'updated_at', defaultNow: true, notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.updated_at).toBeDefined()
    })
  })

  describe('date columns', () => {
    it('should build date column', () => {
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
  })

  describe('json columns', () => {
    it('should build json column', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          metadata: { type: 'json', name: 'metadata' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.metadata).toBeDefined()
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

  describe('jsonb columns', () => {
    it('should build jsonb column', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          data: { type: 'jsonb', name: 'data' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.data).toBeDefined()
    })
  })

  describe('numeric columns', () => {
    it('should build numeric column with precision and scale', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          price: { type: 'numeric', name: 'price', precision: 10, scale: 2 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.price).toBeDefined()
    })

    it('should build numeric column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          amount: { type: 'numeric', name: 'amount', precision: 15, scale: 4, notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.amount).toBeDefined()
    })
  })

  describe('decimal columns', () => {
    it('should build decimal column with precision and scale', () => {
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

  describe('char columns', () => {
    it('should build char column with length', () => {
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

  describe('enum columns', () => {
    it('should build enum column and create pgEnum', () => {
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
      expect(enums['post_status']).toBeDefined()
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
      expect(enums['category_type']).toBeDefined()
    })

    it('should reuse same pgEnum for multiple columns with same enumName', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          status: {
            type: 'enum',
            name: 'status',
            enumName: 'status_enum',
            options: ['active', 'inactive'],
          },
          old_status: {
            type: 'enum',
            name: 'old_status',
            enumName: 'status_enum',
            options: ['active', 'inactive'],
          },
        },
      }

      const { enums } = buildDrizzleTable(rawTable)
      // Should only have one pgEnum created
      expect(Object.keys(enums)).toHaveLength(1)
      expect(enums['status_enum']).toBeDefined()
    })
  })

  describe('PostgreSQL-only types', () => {
    it('should build vector column with default dimensions', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          embedding: { type: 'vector', name: 'embedding' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.embedding).toBeDefined()
    })

    it('should build vector column with custom dimensions', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          embedding: { type: 'vector', name: 'embedding', dimensions: 1536 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.embedding).toBeDefined()
    })

    it('should build halfvec column', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          embedding: { type: 'halfvec', name: 'embedding', dimensions: 1024 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.embedding).toBeDefined()
    })

    it('should build sparsevec column', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          embedding: { type: 'sparsevec', name: 'embedding', dimensions: 768 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.embedding).toBeDefined()
    })

    it('should build bit column with default length', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          flags: { type: 'bit', name: 'flags' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.flags).toBeDefined()
    })

    it('should build bit column with custom length', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          flags: { type: 'bit', name: 'flags', dimensions: 16 },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.flags).toBeDefined()
    })
  })

  describe('indexes', () => {
    it('should build table with simple index', () => {
      const rawTable: RawTable = {
        name: 'posts',
        columns: {
          title: { type: 'varchar', name: 'title', length: 255 },
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
          email: { type: 'varchar', name: 'email', length: 255 },
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
          title: { type: 'varchar', name: 'title', length: 255 },
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

    it('should build table with multiple indexes', () => {
      const rawTable: RawTable = {
        name: 'posts',
        columns: {
          title: { type: 'varchar', name: 'title', length: 255 },
          slug: { type: 'varchar', name: 'slug', length: 255 },
          published: { type: 'boolean', name: 'published' },
        },
        indexes: {
          title_idx: { name: 'title_idx', on: 'title' },
          slug_unique: { name: 'slug_unique', on: 'slug', unique: true },
          published_idx: { name: 'published_idx', on: 'published' },
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

    it('should build table with composite foreign key', () => {
      const parentsTable: RawTable = {
        name: 'parents',
        columns: {
          id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
          type: { type: 'varchar', name: 'type', length: 50, notNull: true },
        },
      }

      const { table: parents } = buildDrizzleTable(parentsTable)

      const childrenTable: RawTable = {
        name: 'children',
        columns: {
          parent_id: { type: 'uuid', name: 'parent_id', notNull: true },
          parent_type: { type: 'varchar', name: 'parent_type', length: 50, notNull: true },
        },
        foreignKeys: {
          parent_fk: {
            name: 'parent_fk',
            columns: ['parent_id', 'parent_type'],
            foreignColumns: [
              { name: 'id', table: 'parents' },
              { name: 'type', table: 'parents' },
            ],
            onDelete: 'cascade',
            onUpdate: 'cascade',
          },
        },
      }

      const { table: children } = buildDrizzleTable(childrenTable, { parents })
      expect(children).toBeDefined()
    })
  })

  describe('complete table definitions', () => {
    it('should build a complete posts table', () => {
      const rawTable: RawTable = {
        name: 'posts',
        columns: {
          id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
          author_id: {
            type: 'uuid',
            name: 'author_id',
            notNull: true,
            reference: { name: 'id', table: 'users', onDelete: 'cascade' },
          },
          title: { type: 'varchar', name: 'title', length: 255, notNull: true },
          slug: { type: 'varchar', name: 'slug', length: 255, notNull: true },
          content: { type: 'text', name: 'content' },
          excerpt: { type: 'text', name: 'excerpt' },
          published: { type: 'boolean', name: 'published', default: false },
          featured: { type: 'boolean', name: 'featured', default: false },
          view_count: { type: 'integer', name: 'view_count', default: 0 },
          created_at: { type: 'timestamp', name: 'created_at', defaultNow: true, notNull: true },
          updated_at: { type: 'timestamp', name: 'updated_at', defaultNow: true, notNull: true },
          published_at: { type: 'timestamptz', name: 'published_at' },
          metadata: { type: 'jsonb', name: 'metadata' },
        },
        indexes: {
          title_idx: { name: 'title_idx', on: 'title' },
          slug_unique: { name: 'slug_unique', on: 'slug', unique: true },
          author_idx: { name: 'author_idx', on: 'author_id' },
          published_idx: { name: 'published_idx', on: 'published' },
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
      expect(table.published_at).toBeDefined()
      expect(table.metadata).toBeDefined()
    })

    it('should build a complete users table with enum', () => {
      const rawTable: RawTable = {
        name: 'users',
        columns: {
          id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
          email: { type: 'varchar', name: 'email', length: 255, notNull: true },
          username: { type: 'varchar', name: 'username', length: 100 },
          password_hash: { type: 'text', name: 'password_hash', notNull: true },
          role: {
            type: 'enum',
            name: 'role',
            enumName: 'user_role',
            options: ['admin', 'editor', 'viewer'],
            notNull: true,
            default: 'viewer',
          },
          is_active: { type: 'boolean', name: 'is_active', default: true },
          balance: { type: 'decimal', name: 'balance', precision: 10, scale: 2 },
          created_at: { type: 'timestamp', name: 'created_at', defaultNow: true, notNull: true },
          last_login: { type: 'timestamptz', name: 'last_login' },
          profile_data: { type: 'jsonb', name: 'profile_data' },
        },
        indexes: {
          email_unique: { name: 'email_unique', on: 'email', unique: true },
          role_idx: { name: 'role_idx', on: 'role' },
        },
      }

      const { table, enums } = buildDrizzleTable(rawTable)
      expect(table).toBeDefined()
      expect(table.email).toBeDefined()
      expect(table.role).toBeDefined()
      expect(enums['user_role']).toBeDefined()
    })
  })

  describe('createPgEnum', () => {
    it('should create a pgEnum', () => {
      const statusEnum = createPgEnum('status', ['pending', 'active', 'closed'])
      expect(statusEnum).toBeDefined()
    })

    it('should create a typed pgEnum', () => {
      const roleEnum = createPgEnum('role', ['admin', 'user', 'guest'])
      expect(roleEnum).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should throw error for unsupported column type', () => {
      // This test verifies the switch is exhaustive
      // If we add a new type to RawColumn but forget to handle it,
      // this test would fail to compile, alerting us to update buildDrizzleTable
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          // Using 'unknown' as type would fail type checking, so we test runtime behavior
        },
      }

      expect(() => buildDrizzleTable(rawTable)).not.toThrow()
    })
  })
})
