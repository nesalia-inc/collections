# Required & Optional Fields

Define whether fields are required or optional.

## Required vs Optional

```typescript
// Required field (default)
name: field({ fieldType: f.text() })

// Optional field
nickname: field({ fieldType: f.text(), required: false })

// With default value
status: field({ fieldType: f.text(), defaultValue: 'draft' })
```

## Required Fields

Required fields must be provided when creating a record:

```typescript
const posts = collection({
  slug: 'posts',
  fields: {
    title: field({ fieldType: f.text(), required: true }),
    content: field({ fieldType: f.text(), required: true })
  }
})
```

## Optional Fields

Optional fields can be omitted when creating a record:

```typescript
const users = collection({
  slug: 'users',
  fields: {
    name: field({ fieldType: f.text(), required: true }),
    bio: field({ fieldType: f.text(), required: false }),
    avatar: field({ fieldType: f.text(), required: false })
  }
})
```

## With Default Values

Optional fields often have default values:

```typescript
status: field({
  fieldType: f.select(['draft', 'published']),
  defaultValue: 'draft'
})

published: field({
  fieldType: f.boolean(),
  defaultValue: false
})
```

## Hidden Fields

Fields can be hidden from API responses:

```typescript
password: field({
  fieldType: f.text(),
  hidden: true  // Not returned in API responses
})
```
