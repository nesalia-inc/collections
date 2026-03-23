# Select

The `select` option allows you to specify which fields to return from a query, improving performance by reducing data transfer.

## Type Definition

```typescript
type Select<T> = (selector: Selector<T>) => SelectedFields<T>

type Selector<T> = {
  [K in keyof T]: T[K] extends object ? Selector<T[K]> : SelectorField<T[K]>
} & {
  _all: () => T
}

type SelectorField<T> = T

type SelectedFields<T> = {
  [K in keyof T]?: T[K] extends object ? SelectedFields<T[K]> : boolean
}
```

## Basic Usage

Use a selector function with full type safety:

```typescript
const result = await config.db.posts.find({
  select: (p) => ({
    id: p.id,
    title: p.title
  })
})

// result.current.data = [{ id: 1, title: 'Post 1' }]
```

## With Nested Relations

Select fields from related collections:

```typescript
const result = await config.db.posts.find({
  select: (p) => ({
    id: p.id,
    title: p.title,
    author: {
      id: p.author.id,
      name: p.author.name
    }
  })
})

// result.current.data = [
//   { id: 1, title: 'Post 1', author: { id: 1, name: 'John' } }
// ]
```

## With findById

```typescript
const result = await config.db.posts.findById({
  id: 1,
  select: (p) => ({
    id: p.id,
    title: p.title
  })
})

// result.data = { id: 1, title: 'Post 1' }
```

## Select All Fields

Use `_all` to select all fields:

```typescript
const result = await config.db.posts.find({
  select: (p) => p._all()
})
```

## Notes

- If `select` is not provided, all fields are returned by default
- The `id` field is always included even if not explicitly selected
- Selecting only required fields improves query performance
- Full autocomplete support for all fields and nested relations
- Works with all find operations (find, findFirst, findById)
