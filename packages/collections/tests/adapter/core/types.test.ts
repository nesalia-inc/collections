import { describe, it, expect } from 'vitest'
import type {
  RawColumn,
  RawTable,
  RawIndex,
  RawForeignKey,
  BaseColumn,
  ReferenceAction,
} from '../../src/adapter/core/types'

describe('BaseColumn', () => {
  it('should allow basic properties', () => {
    const col: BaseColumn = {
      name: 'id',
      notNull: true,
      primaryKey: true,
    }
    expect(col.name).toBe('id')
    expect(col.notNull).toBe(true)
    expect(col.primaryKey).toBe(true)
  })

  it('should allow default value', () => {
    const col: BaseColumn = {
      name: 'status',
      default: 'draft',
    }
    expect(col.default).toBe('draft')
  })

  it('should allow reference', () => {
    const col: BaseColumn = {
      name: 'author_id',
      reference: {
        name: 'id',
        table: 'users',
        onDelete: 'cascade',
      },
    }
    expect(col.reference?.table).toBe('users')
    expect(col.reference?.onDelete).toBe('cascade')
  })
})

describe('RawColumn discriminated union', () => {
  it('should allow boolean type', () => {
    const col: RawColumn = { type: 'boolean', name: 'is_active' }
    expect(col.type).toBe('boolean')
  })

  it('should allow serial with autoIncrement', () => {
    const col: RawColumn = { type: 'serial', name: 'id', autoIncrement: true, primaryKey: true }
    expect(col.type).toBe('serial')
    expect(col.autoIncrement).toBe(true)
  })

  it('should allow integer with autoIncrement', () => {
    const col: RawColumn = { type: 'integer', name: 'counter', autoIncrement: true }
    expect(col.type).toBe('integer')
    expect(col.autoIncrement).toBe(true)
  })

  it('should allow numeric with precision and scale', () => {
    const col: RawColumn = { type: 'numeric', name: 'price', precision: 10, scale: 2 }
    expect(col.type).toBe('numeric')
    expect(col.precision).toBe(10)
    expect(col.scale).toBe(2)
  })

  it('should allow decimal with precision and scale', () => {
    const col: RawColumn = { type: 'decimal', name: 'amount', precision: 15, scale: 4 }
    expect(col.type).toBe('decimal')
    expect(col.precision).toBe(15)
    expect(col.scale).toBe(4)
  })

  it('should allow real', () => {
    const col: RawColumn = { type: 'real', name: 'weight' }
    expect(col.type).toBe('real')
  })

  it('should allow text', () => {
    const col: RawColumn = { type: 'text', name: 'content' }
    expect(col.type).toBe('text')
  })

  it('should allow varchar with length', () => {
    const col: RawColumn = { type: 'varchar', name: 'slug', length: 255 }
    expect(col.type).toBe('varchar')
    expect(col.length).toBe(255)
  })

  it('should allow char with length', () => {
    const col: RawColumn = { type: 'char', name: 'code', length: 3 }
    expect(col.type).toBe('char')
    expect(col.length).toBe(3)
  })

  it('should allow date', () => {
    const col: RawColumn = { type: 'date', name: 'birthday' }
    expect(col.type).toBe('date')
  })

  it('should allow timestamp with optional properties', () => {
    const col: RawColumn = {
      type: 'timestamp',
      name: 'created_at',
      precision: 6,
      withTimezone: false,
      defaultNow: true,
    }
    expect(col.type).toBe('timestamp')
    expect(col.precision).toBe(6)
    expect(col.withTimezone).toBe(false)
    expect(col.defaultNow).toBe(true)
  })

  it('should allow timestamptz with optional properties', () => {
    const col: RawColumn = {
      type: 'timestamptz',
      name: 'updated_at',
      precision: 3,
      defaultNow: true,
    }
    expect(col.type).toBe('timestamptz')
    expect(col.precision).toBe(3)
    expect(col.defaultNow).toBe(true)
  })

  it('should allow json', () => {
    const col: RawColumn = { type: 'json', name: 'metadata' }
    expect(col.type).toBe('json')
  })

  it('should allow jsonb', () => {
    const col: RawColumn = { type: 'jsonb', name: 'config' }
    expect(col.type).toBe('jsonb')
  })

  it('should allow uuid with defaultRandom', () => {
    const col: RawColumn = { type: 'uuid', name: 'id', defaultRandom: true, primaryKey: true, notNull: true }
    expect(col.type).toBe('uuid')
    expect(col.defaultRandom).toBe(true)
    expect(col.primaryKey).toBe(true)
  })

  it('should allow enum with enumName and options', () => {
    const col: RawColumn = {
      type: 'enum',
      name: 'status',
      enumName: 'post_status',
      options: ['draft', 'published', 'archived'],
    }
    expect(col.type).toBe('enum')
    expect(col.enumName).toBe('post_status')
    expect(col.options).toEqual(['draft', 'published', 'archived'])
  })

  it('should allow vector with dimensions', () => {
    const col: RawColumn = { type: 'vector', name: 'embedding', dimensions: 1536 }
    expect(col.type).toBe('vector')
    expect(col.dimensions).toBe(1536)
  })

  it('should allow halfvec with dimensions', () => {
    const col: RawColumn = { type: 'halfvec', name: 'embedding', dimensions: 2048 }
    expect(col.type).toBe('halfvec')
    expect(col.dimensions).toBe(2048)
  })

  it('should allow sparsevec with dimensions', () => {
    const col: RawColumn = { type: 'sparsevec', name: 'embedding', dimensions: 1000 }
    expect(col.type).toBe('sparsevec')
    expect(col.dimensions).toBe(1000)
  })

  it('should allow bit with dimensions', () => {
    const col: RawColumn = { type: 'bit', name: 'flags', dimensions: 8 }
    expect(col.type).toBe('bit')
    expect(col.dimensions).toBe(8)
  })

  it('should combine BaseColumn properties with type-specific properties', () => {
    const col: RawColumn = {
      type: 'uuid',
      name: 'author_id',
      notNull: true,
      primaryKey: true,
      defaultRandom: true,
      reference: {
        name: 'id',
        table: 'users',
        onDelete: 'cascade',
        onUpdate: 'cascade',
      },
    }
    expect(col.name).toBe('author_id')
    expect(col.notNull).toBe(true)
    expect(col.primaryKey).toBe(true)
    expect(col.defaultRandom).toBe(true)
    expect(col.reference?.table).toBe('users')
  })
})

describe('RawIndex', () => {
  it('should allow basic index', () => {
    const idx: RawIndex = { name: 'title_idx', on: 'title' }
    expect(idx.name).toBe('title_idx')
    expect(idx.on).toBe('title')
  })

  it('should allow composite index', () => {
    const idx: RawIndex = { name: 'author_title_idx', on: ['author_id', 'title'] }
    expect(idx.name).toBe('author_title_idx')
    expect(idx.on).toEqual(['author_id', 'title'])
  })

  it('should allow unique index', () => {
    const idx: RawIndex = { name: 'slug_unique', on: 'slug', unique: true }
    expect(idx.unique).toBe(true)
  })
})

describe('RawForeignKey', () => {
  it('should allow basic foreign key', () => {
    const fk: RawForeignKey = {
      name: 'author_fk',
      columns: ['author_id'],
      foreignColumns: [{ name: 'id', table: 'users' }],
    }
    expect(fk.name).toBe('author_fk')
    expect(fk.columns).toEqual(['author_id'])
    expect(fk.foreignColumns).toEqual([{ name: 'id', table: 'users' }])
  })

  it('should allow composite foreign key', () => {
    const fk: RawForeignKey = {
      name: 'composite_fk',
      columns: ['parent_id', 'type'],
      foreignColumns: [
        { name: 'id', table: 'parents' },
        { name: 'type', table: 'parent_types' },
      ],
    }
    expect(fk.columns).toEqual(['parent_id', 'type'])
    expect(fk.foreignColumns).toHaveLength(2)
  })

  it('should allow referential actions', () => {
    const fk: RawForeignKey = {
      name: 'user_fk',
      columns: ['user_id'],
      foreignColumns: [{ name: 'id', table: 'users' }],
      onDelete: 'set null',
      onUpdate: 'cascade',
    }
    expect(fk.onDelete).toBe('set null')
    expect(fk.onUpdate).toBe('cascade')
  })
})

describe('RawTable', () => {
  it('should allow basic table', () => {
    const table: RawTable = {
      name: 'posts',
      columns: {
        id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
        title: { type: 'varchar', name: 'title', length: 255, notNull: true },
        content: { type: 'text', name: 'content' },
        status: { type: 'enum', name: 'status', enumName: 'post_status', options: ['draft', 'published'] },
      },
    }
    expect(table.name).toBe('posts')
    expect(Object.keys(table.columns)).toHaveLength(4)
    expect(table.columns.id.type).toBe('uuid')
    expect(table.columns.status.type).toBe('enum')
  })

  it('should allow table with indexes', () => {
    const table: RawTable = {
      name: 'posts',
      columns: {
        title: { type: 'varchar', name: 'title', length: 255 },
        slug: { type: 'varchar', name: 'slug', length: 255 },
      },
      indexes: {
        title_idx: { name: 'title_idx', on: 'title' },
        slug_unique: { name: 'slug_unique', on: 'slug', unique: true },
      },
    }
    expect(table.indexes).toBeDefined()
    expect(Object.keys(table.indexes!)).toHaveLength(2)
  })

  it('should allow table with foreign keys', () => {
    const table: RawTable = {
      name: 'posts',
      columns: {
        author_id: { type: 'uuid', name: 'author_id' },
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
    expect(table.foreignKeys).toBeDefined()
    expect(table.foreignKeys!.author_fk.columns).toEqual(['author_id'])
  })

  it('should allow full table definition', () => {
    const table: RawTable = {
      name: 'posts',
      columns: {
        id: { type: 'uuid', name: 'id', primaryKey: true, defaultRandom: true, notNull: true },
        author_id: { type: 'uuid', name: 'author_id', notNull: true, reference: { name: 'id', table: 'users', onDelete: 'cascade' } },
        title: { type: 'varchar', name: 'title', length: 255, notNull: true },
        content: { type: 'text', name: 'content' },
        published: { type: 'boolean', name: 'published', default: false },
        created_at: { type: 'timestamp', name: 'created_at', defaultNow: true, notNull: true },
        updated_at: { type: 'timestamp', name: 'updated_at', defaultNow: true, notNull: true },
      },
      indexes: {
        author_idx: { name: 'author_idx', on: 'author_id' },
        published_idx: { name: 'published_idx', on: 'published' },
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
    expect(table.name).toBe('posts')
    expect(Object.keys(table.columns)).toHaveLength(7)
    expect(table.indexes).toBeDefined()
    expect(table.foreignKeys).toBeDefined()
  })
})

describe('ReferenceAction type', () => {
  it.each(['cascade', 'set null', 'set default', 'restrict', 'no action'] as const)(
    'should allow %s',
    (action) => {
      const col: BaseColumn = {
        name: 'test',
        reference: { name: 'id', table: 'test', onDelete: action, onUpdate: action },
      }
      expect(col.reference?.onDelete).toBe(action)
      expect(col.reference?.onUpdate).toBe(action)
    }
  )
})
