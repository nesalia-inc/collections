# Field Options

## Required

```typescript
const name = field({
  fieldType: f.text(),
  required: true
})
```

## Unique

```typescript
const email = field({
  fieldType: f.email(),
  unique: true
})
```

## Default Value

```typescript
const status = field({
  fieldType: f.select(['draft', 'published']),
  defaultValue: 'draft'
})

const published = field({
  fieldType: f.boolean(),
  defaultValue: false
})
```

## Hidden

```typescript
const password = field({
  fieldType: f.text(),
  hidden: true  // Not returned in API responses
})
```
