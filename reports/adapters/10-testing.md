# Testing Strategy

## Unit Tests

```typescript
// tests/adapter/unit/columnMapping.test.ts

describe('ColumnType to RawColumn mapping', () => {
  it('should map text with required to notNull', () => {
    const field = mockField({ fieldType: f.text(), required: true })
    const raw = fieldToRawColumn('content', field)
    expect(raw.type).toBe('text')
    expect(raw.notNull).toBe(true)
  })

  it('should map select with enum', () => {
    const field = mockField({ fieldType: f.select(['draft', 'published']) })
    const raw = fieldToRawColumn('status', field)
    expect(raw.type).toBe('enum')
    expect(raw.enumName).toBe('status_enum')
    expect(raw.options).toEqual(['draft', 'published'])
  })

  it('should map uuid with defaultRandom', () => {
    const field = mockField({ fieldType: f.uuid() })
    const raw = fieldToRawColumn('id', field)
    expect(raw.type).toBe('uuid')
    expect(raw.defaultRandom).toBe(true)
  })
})

describe('whereToDrizzle operator coverage', () => {
  it.each([
    ['Eq', eq(p => p.title, 'Test')],
    ['Ne', ne(p => p.status, 'archived')],
    ['Gt', gt(p => p.views, 100)],
    ['Gte', gte(p => p.priority, 5)],
    ['Lt', lt(p => p.score, 10)],
    ['Lte', lte(p => p.count, 100)],
    ['Between', between(p => p.views, 1, 100)],
    ['In', inList(p => p.status, ['draft', 'review'])],
    ['IsNull', isNull(p => p.deletedAt)],
    ['IsNotNull', isNotNull(p => p.publishedAt)],
    ['Contains', contains(p => p.title, 'guide')],
    ['StartsWith', startsWith(p => p.slug, 'how-to')],
    ['EndsWith', endsWith(p => p.email, '@company.com')],
    ['And', and(eq(p => p.a, 1), eq(p => p.b, 2))],
    ['Or', or(eq(p => p.a, 1), eq(p => p.b, 2))],
  ])('should handle %s operator', (name, node) => {
    expect(() => whereToDrizzle(where(node), mockTable)).not.toThrow()
  })
})
```

## Integration Tests (planned - adapter not yet implemented)

```typescript
// tests/adapter/postgres.test.ts

describe('PostgresAdapter', () => {
  let adapter: PostgresAdapter

  beforeAll(async () => {
    adapter = new PostgresAdapter({ url: process.env.POSTGRES_URL! })
    await adapter.initialize([postsCollection])
  })

  describe('create', () => {
    it('should create record with auto-generated id', async () => {
      const result = await adapter.forCollection('posts').create({
        data: { title: 'Test', content: 'Content' }
      })
      expect(result.id).toBeDefined()
    })

    it('should run beforeCreate hook', async () => {
      const hookFn = vi.fn()
      const collection = collection({
        slug: 'posts',
        fields: {
          title: field({ fieldType: f.text() }),
        },
        hooks: {
          beforeCreate: [async (ctx: any) => { hookFn() }]
        }
      })
      await adapter.initialize([collection])
      await adapter.forCollection('posts').create({
        data: { title: 'Test' }
      })
      expect(hookFn).toHaveBeenCalled()
    })
  })

  describe('findMany with where', () => {
    it('should filter by equality', async () => {
      const results = await adapter.forCollection('posts').findMany({
        where: where((p) => [eq(p.title, 'Test')])
      })
      expect(results[0].title).toBe('Test')
    })
  })

  describe('exists', () => {
    it('should return true when record exists', async () => {
      await adapter.forCollection('posts').create({ data: { title: 'Exists' } })
      const exists = await adapter.forCollection('posts').exists({
        where: where((p) => [eq(p.title, 'Exists')])
      })
      expect(exists).toBe(true)
    })

    it('should return false when record does not exist', async () => {
      const exists = await adapter.forCollection('posts').exists({
        where: where((p) => [eq(p.title, 'NonExistent')])
      })
      expect(exists).toBe(false)
    })
  })
})
```
