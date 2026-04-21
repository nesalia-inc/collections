import { describe, it, expect } from 'vitest'
import { buildDrizzleTable, createMysqlEnum } from '../../../src/adapter/mysql'
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

    it('should build integer column as primary key', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          id: { type: 'integer', name: 'id', primaryKey: true, autoIncrement: true },
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

    it('should build varchar column with default length of 255', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          name: { type: 'varchar', name: 'name' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.name).toBeDefined()
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

    it('should build char column with default length of 1', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          flag: { type: 'char', name: 'flag' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.flag).toBeDefined()
    })
  })

  describe('real columns (MySQL uses float for single precision)', () => {
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

  describe('numeric columns (MySQL uses double as approximation)', () => {
    it('should build numeric column', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          price: { type: 'numeric', name: 'price' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.price).toBeDefined()
    })

    it('should build numeric column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          amount: { type: 'numeric', name: 'amount', notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.amount).toBeDefined()
    })

    it('should build numeric column as primary key', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          id: { type: 'numeric', name: 'id', primaryKey: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.id).toBeDefined()
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

    it('should build decimal column with default precision and scale', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          amount: { type: 'decimal', name: 'amount' },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.amount).toBeDefined()
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
            defaultNow: true,
            notNull: true,
          },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.updated_at).toBeDefined()
    })
  })

  describe('timestamptz columns (MySQL uses datetime)', () => {
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

  describe('jsonb columns (MySQL uses json)', () => {
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

    it('should build jsonb column with notNull', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          extra: { type: 'jsonb', name: 'extra', notNull: true },
        },
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table.extra).toBeDefined()
    })
  })

  describe('uuid columns (MySQL uses varchar(36))', () => {
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

  describe('enum columns', () => {
    it('should build enum column and create mysqlEnum', () => {
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

    it('should reuse same mysqlEnum for multiple columns with same enumName', () => {
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
      // Should only have one mysqlEnum created
      expect(Object.keys(enums)).toHaveLength(1)
      expect(enums['status_enum']).toBeDefined()
    })

    it('should build enum column as primary key', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          type: {
            type: 'enum',
            name: 'type',
            enumName: 'entity_type',
            options: ['user', 'group'],
            primaryKey: true,
          },
        },
      }

      const { table, enums } = buildDrizzleTable(rawTable)
      expect(table.type).toBeDefined()
      expect(enums['entity_type']).toBeDefined()
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

      expect(() => buildDrizzleTable(rawTable)).toThrow('Type "vector" is not supported in MySQL adapter')
    })

    it('should throw error for halfvec type', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          embedding: { type: 'halfvec', name: 'embedding' },
        },
      }

      expect(() => buildDrizzleTable(rawTable)).toThrow('Type "halfvec" is not supported in MySQL adapter')
    })

    it('should throw error for sparsevec type', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          embedding: { type: 'sparsevec', name: 'embedding' },
        },
      }

      expect(() => buildDrizzleTable(rawTable)).toThrow('Type "sparsevec" is not supported in MySQL adapter')
    })

    it('should throw error for bit type', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          flags: { type: 'bit', name: 'flags' },
        },
      }

      expect(() => buildDrizzleTable(rawTable)).toThrow('Type "bit" is not supported in MySQL adapter')
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

    it('should build table with foreign key with onUpdate', () => {
      const categoriesTable: RawTable = {
        name: 'categories',
        columns: {
          id: { type: 'serial', name: 'id', primaryKey: true },
        },
      }

      const { table: categories } = buildDrizzleTable(categoriesTable)

      const postsTable: RawTable = {
        name: 'posts',
        columns: {
          category_id: { type: 'integer', name: 'category_id', notNull: true },
        },
        foreignKeys: {
          category_fk: {
            name: 'category_fk',
            columns: ['category_id'],
            foreignColumns: [{ name: 'id', table: 'categories' }],
            onDelete: 'restrict',
            onUpdate: 'cascade',
          },
        },
      }

      const { table: posts } = buildDrizzleTable(postsTable, { categories })
      expect(posts).toBeDefined()
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
          metadata: { type: 'json', name: 'metadata' },
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
          profile_data: { type: 'json', name: 'profile_data' },
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

    it('should build a table with all MySQL column types', () => {
      const rawTable: RawTable = {
        name: 'all_types',
        columns: {
          id: { type: 'serial', name: 'id', primaryKey: true },
          bool_field: { type: 'boolean', name: 'bool_field' },
          int_field: { type: 'integer', name: 'int_field' },
          numeric_field: { type: 'numeric', name: 'numeric_field' },
          decimal_field: { type: 'decimal', name: 'decimal_field', precision: 10, scale: 2 },
          real_field: { type: 'real', name: 'real_field' },
          text_field: { type: 'text', name: 'text_field' },
          varchar_field: { type: 'varchar', name: 'varchar_field', length: 100 },
          char_field: { type: 'char', name: 'char_field', length: 1 },
          date_field: { type: 'date', name: 'date_field' },
          timestamp_field: { type: 'timestamp', name: 'timestamp_field' },
          timestamptz_field: { type: 'timestamptz', name: 'timestamptz_field' },
          json_field: { type: 'json', name: 'json_field' },
          jsonb_field: { type: 'jsonb', name: 'jsonb_field' },
          uuid_field: { type: 'uuid', name: 'uuid_field' },
          enum_field: {
            type: 'enum',
            name: 'enum_field',
            enumName: 'color',
            options: ['red', 'green', 'blue'],
          },
        },
      }

      const { table, enums } = buildDrizzleTable(rawTable)
      expect(table).toBeDefined()
      expect(enums['color']).toBeDefined()
    })
  })

  describe('createMysqlEnum', () => {
    it('should create a mysqlEnum', () => {
      const statusEnum = createMysqlEnum('status', ['pending', 'active', 'closed'])
      expect(statusEnum).toBeDefined()
    })

    it('should create a typed mysqlEnum', () => {
      const roleEnum = createMysqlEnum('role', ['admin', 'user', 'guest'])
      expect(roleEnum).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should return enums object for MySQL', () => {
      const rawTable: RawTable = {
        name: 'test_table',
        columns: {
          name: { type: 'text', name: 'name' },
        },
      }

      const { enums } = buildDrizzleTable(rawTable)
      expect(enums).toBeDefined()
      expect(typeof enums).toBe('object')
    })

    it('should handle empty table without errors', () => {
      const rawTable: RawTable = {
        name: 'empty_table',
        columns: {},
      }

      const { table } = buildDrizzleTable(rawTable)
      expect(table).toBeDefined()
    })
  })
})