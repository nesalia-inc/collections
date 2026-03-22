# Virtual Collections

Virtual collections are collections that exist in the system but are not defined by the user. They are automatically created by the framework for authentication tables and can be used like regular collections.

## What are Virtual Collections?

Virtual collections are automatically generated collections for:
- **Auth tables** - `users`, `sessions`, `accounts`, `verification`, `apiKeys`
- **System tables** - Any tables created by plugins or the framework

## Key Features

### Same API as Regular Collections

```typescript
// Regular collection
const posts = await config.db.posts.find({ limit: 10 })

// Virtual collection (auth table)
const users = await config.db.users.find({ limit: 10 })
const sessions = await config.db.sessions.find({
  where: { userId: user.data.id }
})
```

### Hooks Support

Add hooks to virtual collections:

```typescript
auth: {
  emailAndPassword: { enabled: true },
  hooks: {
    users: {
      afterRead: [
        async ({ result }) => {
          return result.map(user => ({
            ...user,
            password: undefined
          }))
        }
      ]
    }
  }
}
```

### Permissions Support

Apply permissions to virtual collections:

```typescript
auth: {
  emailAndPassword: { enabled: true },
  permissions: {
    users: {
      read: async ({ user }) => user?.role === 'admin',
      update: async ({ user, current }) => user?.role === 'admin'
    }
  }
}
```

## Use Cases

### Mask Sensitive Data

Hide password fields from API responses:

```typescript
auth: {
  hooks: {
    users: {
      afterRead: [
        async ({ result }) => {
          return result.map(user => ({
            ...user,
            password: undefined,
            emailVerified: undefined
          }))
        }
      ]
    }
  }
}
```

### Access Control

Restrict access to auth tables:

```typescript
auth: {
  permissions: {
    sessions: {
      read: async ({ user, query }) => {
        // Only see own sessions
        return { userId: user.id }
      }
    }
  }
}
```

### Audit Logging

Log access to sensitive tables:

```typescript
auth: {
  hooks: {
    sessions: {
      afterCreate: [
        async ({ result, data }) => {
          await auditLogs.create({
            data: {
              action: 'session_created',
              userId: data.userId,
              sessionId: result.data.id
            }
          })
        }
      ]
    }
  }
}
```

## Limitations

Some features may not be available on virtual collections:
- Cannot define custom fields
- Cannot modify the schema
- Some options may be read-only

## Summary

| Feature | Regular Collection | Virtual Collection |
|---------|-------------------|-------------------|
| Define fields | ✓ | ✗ |
| Add hooks | ✓ | ✓ |
| Add permissions | ✓ | ✓ |
| CRUD operations | ✓ | ✓ |
| Custom indexes | ✓ | ✗ |

Virtual collections provide the same API experience while being managed by the framework for auth and system tables.