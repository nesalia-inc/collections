# count

Count records matching conditions.

## Function Signature

```typescript
count(options: CountOperation): AsyncResult<number, CountError>
```

## Type Definition

```typescript
type CountOperation = {
  where: Where
}
```

## Example

```typescript
const result = await config.db.posts.count({
  where: where(p => p.published.eq(true))
})

// result.data = 42
```
