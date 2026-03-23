# findFirst

Get the first record matching conditions.

```typescript
const result = await config.db.posts.findFirst({
  where: { slug: 'my-post' }
})
```

## Options

```typescript
type FindFirstOperation = {
  where: Where
  orderBy?: OrderBy
  include?: Include
}
```
