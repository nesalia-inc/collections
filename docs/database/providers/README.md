# Database Providers

Collections provides a unified DSL (Domain-Specific Language) for defining fields and collections, which is then translated to the appropriate database-specific syntax based on the chosen provider.

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Collection Code                     │
├─────────────────────────────────────────────────────────────┤
│  fields: {                                                 │
│    title: text(),        // Unified DSL                    │
│    uuid: uuid(),                                          │
│    data: json()                                            │
│  }                                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Collections Provider                     │
├─────────────────────────────────────────────────────────────┤
│  translateField(field, provider)                            │
│                                                              │
│  text()      → pgText() | mysqlText() | text()             │
│  uuid()      → pgUuid() | varchar(36)  | text()            │
│  json()      → pgJsonb() | mysqlJson() | text()           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Database-Specific                       │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL    │    MySQL           │    SQLite             │
│  ───────────   │    ─────           │    ──────             │
│  text          │    text            │    text               │
│  uuid          │    varchar(36)     │    text               │
│  jsonb         │    json            │    text               │
└─────────────────────────────────────────────────────────────┘
```

## Documents

- [Configuration](./configuration.md) - Setting up providers
- [Field Types](./field-types.md) - How field types map to database columns
- [Custom Field Types](./custom-field-types.md) - Creating custom field types
- [Migrating](./migrating.md) - Switching between providers
- [Migrations](./migrations.md) - Schema migrations
- [Custom Providers](./custom.md) - Creating custom providers

## The Problem

Drizzle ORM provides different column types for each database provider:

```typescript
// PostgreSQL
import { pgText, pgUuid, pgTimestamp, pgJsonb } from 'drizzle-orm/pg-core'

// MySQL
import { mysqlText, mysqlDatetime, mysqlJson } from 'drizzle-orm/mysql-core'

// SQLite
import { text, integer } from 'drizzle-orm/sqlite-core'
```

This creates a challenge: your field definitions become provider-specific, making it difficult to switch databases or support multiple databases.

## The Solution

Collections introduces a **provider abstraction layer** that allows you to define fields using a unified DSL. The provider translates these definitions to the appropriate database-specific columns.

## Summary

| Concept | Description |
|---------|-------------|
| **Provider** | Database backend: `pg`, `mysql`, or `sqlite` |
| **Adapter** | Connection method for each provider |
| **Translation** | Automatic conversion of field types |
| **Provider Context** | Access provider in custom field types |
| **Unified DSL** | Write once, run on any database |
