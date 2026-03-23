# exists

Check if a record exists.

## Function Signature

```typescript
exists(options: ExistsOperation): AsyncResult<boolean, ExistsError>
```

## Type Definition

```typescript
type ExistsOperation = {
  where: Where
}
```

## Example

```typescript
const result = await config.db.posts.exists({
  where: { slug: 'my-post' }
})

// result.data = true
```
