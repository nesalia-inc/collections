# findFirst

Get the first record matching conditions.

## Function Signature

```typescript
findFirst(options: FindFirstOperation): AsyncResult<T, FindFirstError>
```

## Type Definition

```typescript
type FindFirstOperation = {
  where: Where
  select?: Select
  orderBy?: OrderBy
  include?: Include
}
```

## Examples

### Basic usage

```typescript
const result = await config.db.posts.findFirst({
  where: where(p => p.slug.eq('my-post'))
})
```

### With select

```typescript
const result = await config.db.posts.findFirst({
  where: where(p => p.slug.eq('my-post')),
  select: (p) => ({
    id: p.id,
    title: p.title
  })
})
```

### With orderBy

```typescript
const result = await config.db.posts.findFirst({
  where: where(p => p.published.eq(true)),
  orderBy: { createdAt: 'desc' }
})
```
