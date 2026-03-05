# Internationalization (i18n)

## Overview

`@deessejs/collections` has native, first-class support for internationalization. All user-facing strings—labels, descriptions, error messages, enum values—can be translated without requiring external i18n libraries or complex setup.

## Core Principles

### i18n by Default

Every collection, field, and validation message supports i18n out of the box:

```typescript
import { collection, field } from '@deessejs/collections'
import { text, email } from '@deessejs/collections/fields'

export const posts = collection({
  slug: 'posts',

  // Collection metadata with i18n support
  label: {
    en: 'Blog Posts',
    fr: 'Articles de Blog',
    es: 'Artículos de Blog',
    de: 'Blog-Beiträge'
  },

  description: {
    en: 'Manage your blog posts and articles',
    fr: 'Gérez vos articles de blog',
    es: 'Administra tus entradas de blog',
    de: 'Verwalten Sie Ihre Blog-Beiträge'
  },

  fields: {
    title: field({
      type: text({
        min: 3,
        max: 255
      }),

      // Field labels per locale
      label: {
        en: 'Title',
        fr: 'Titre',
        es: 'Título',
        de: 'Titel'
      },

      // Field descriptions per locale
      description: {
        en: 'The title of your blog post',
        fr: 'Le titre de votre article',
        es: 'El título de tu entrada',
        de: 'Der Titel Ihres Blog-Beitrags'
      },

      // Validation error messages per locale
      messages: {
        tooShort: {
          en: 'Title must be at least 3 characters',
          fr: 'Le titre doit comporter au moins 3 caractères',
          es: 'El título debe tener al menos 3 caracteres',
          de: 'Der Titel muss mindestens 3 Zeichen lang sein'
        },
        tooLong: {
          en: 'Title must be at most 255 characters',
          fr: 'Le titre ne peut pas dépasser 255 caractères',
          es: 'El título no puede tener más de 255 caracteres',
          de: 'Der Titel darf maximal 255 Zeichen lang sein'
        }
      }
    })
  }
})
```

## Setting Up Locales

### Define Supported Locales

```typescript
// config/i18n.ts
export const i18nConfig = {
  defaultLocale: 'en',
  locales: ['en', 'fr', 'es', 'de'],

  // Fallback locale when translation is missing
  fallbackLocale: 'en'
}
```

### Configuration

```typescript
// config/database.ts
import { defineConfig } from '@deessejs/collections'
import { i18nConfig } from './i18n'

export const { collections, db } = defineConfig({
  database: {
    url: process.env.DATABASE_URL!
  },

  i18n: i18nConfig,

  collections: [
    posts,
    users,
    comments
  ]
})
```

## Collection i18n

### Collection Labels and Descriptions

```typescript
export const users = collection({
  slug: 'users',

  // Singular label
  label: {
    en: 'User',
    fr: 'Utilisateur',
    es: 'Usuario',
    de: 'Benutzer'
  },

  // Plural label
  plural: {
    en: 'Users',
    fr: 'Utilisateurs',
    es: 'Usuarios',
    de: 'Benutzer'
  },

  // Description
  description: {
    en: 'Manage user accounts and permissions',
    fr: 'Gérer les comptes utilisateurs et les permissions',
    es: 'Administrar cuentas de usuario y permisos',
    de: 'Benutzerkonten und Berechtigungen verwalten'
  },

  fields: { /* ... */ }
})
```

### Collection-Specific Messages

```typescript
export const orders = collection({
  slug: 'orders',

  label: {
    en: 'Order',
    fr: 'Commande',
    es: 'Pedido'
  },

  // Custom operation messages
  messages: {
    createSuccess: {
      en: 'Order created successfully',
      fr: 'Commande créée avec succès',
      es: 'Pedido creado exitosamente'
    },
    updateSuccess: {
      en: 'Order updated successfully',
      fr: 'Commande mise à jour avec succès',
      es: 'Pedido actualizado exitosamente'
    },
    deleteSuccess: {
      en: 'Order deleted successfully',
      fr: 'Commande supprimée avec succès',
      es: 'Pedido eliminado exitosamente'
    },
    notFound: {
      en: 'Order not found',
      fr: 'Commande non trouvée',
      es: 'Pedido no encontrado'
    }
  },

  fields: { /* ... */ }
})
```

## Field i18n

### Field Labels

```typescript
fields: {
  firstName: field({
    type: text(),

    label: {
      en: 'First Name',
      fr: 'Prénom',
      es: 'Nombre',
      de: 'Vorname'
    }
  }),

  lastName: field({
    type: text(),

    label: {
      en: 'Last Name',
      fr: 'Nom',
      es: 'Apellido',
      de: 'Nachname'
    }
  }),

  emailAddress: field({
    type: email(),

    label: {
      en: 'Email Address',
      fr: 'Adresse Email',
      es: 'Dirección de Correo',
      de: 'E-Mail-Adresse'
    }
  })
}
```

### Field Descriptions and Help Text

```typescript
fields: {
  password: field({
    type: text({ min: 8 }),

    label: {
      en: 'Password',
      fr: 'Mot de passe',
      es: 'Contraseña',
      de: 'Passwort'
    },

    description: {
      en: 'Must be at least 8 characters long',
      fr: 'Doit comporter au moins 8 caractères',
      es: 'Debe tener al menos 8 caracteres',
      de: 'Muss mindestens 8 Zeichen lang sein'
    },

    // Help text (shown as a tooltip or hint)
    help: {
      en: 'Use a strong password with uppercase, lowercase, numbers, and symbols',
      fr: 'Utilisez un mot de passe fort avec majuscules, minuscules, chiffres et symboles',
      es: 'Usa una contraseña fuerte con mayúsculas, minúsculas, números y símbolos',
      de: 'Verwenden Sie ein sicheres Passwort mit Groß-/Kleinschreibung, Zahlen und Symbolen'
    }
  })
}
```

## Validation Messages

### Built-in Validation Messages

```typescript
fields: {
  username: field({
    type: text({
      min: 3,
      max: 20
    }),

    label: {
      en: 'Username',
      fr: "Nom d'utilisateur",
      es: 'Nombre de usuario'
    },

    // Override default validation messages
    messages: {
      required: {
        en: 'Username is required',
        fr: "Le nom d'utilisateur est requis",
        es: 'El nombre de usuario es obligatorio'
      },
      tooShort: {
        en: 'Username must be at least 3 characters',
        fr: "Le nom d'utilisateur doit comporter au moins 3 caractères",
        es: 'El nombre de usuario debe tener al menos 3 caracteres'
      },
      tooLong: {
        en: 'Username must be at most 20 characters',
        fr: "Le nom d'utilisateur ne peut pas dépasser 20 caractères",
        es: 'El nombre de usuario no puede tener más de 20 caracteres'
      },
      invalid: {
        en: 'Username must contain only letters, numbers, and underscores',
        fr: "Le nom d'utilisateur ne peut contenir que des lettres, des chiffres et des tirets bas",
        es: 'El nombre de usuario solo puede contener letras, números y guiones bajos'
      }
    }
  })
}
```

### Custom Validation Messages

```typescript
fields: {
  age: field({
    type: number({
      min: 18,
      max: 120
    }),

    label: {
      en: 'Age',
      fr: 'Âge',
      es: 'Edad',
      de: 'Alter'
    },

    messages: {
      min: {
        en: 'You must be at least 18 years old',
        fr: 'Vous devez avoir au moins 18 ans',
        es: 'Debes tener al menos 18 años',
        de: 'Sie müssen mindestens 18 Jahre alt sein'
      },
      custom: {
        en: 'Please enter a valid age',
        fr: 'Veuillez entrer un âge valide',
        es: 'Por favor ingrese una edad válida',
        de: 'Bitte geben Sie ein gültiges Alter ein'
      }
    }
  })
}
```

## Enum i18n

### Translated Enum Values

```typescript
fields: {
  status: field({
    type: enumField(['draft', 'published', 'archived']),

    label: {
      en: 'Status',
      fr: 'Statut',
      es: 'Estado',
      de: 'Status'
    },

    // Translate enum values
    enumLabels: {
      draft: {
        en: 'Draft',
        fr: 'Brouillon',
        es: 'Borrador',
        de: 'Entwurf'
      },
      published: {
        en: 'Published',
        fr: 'Publié',
        es: 'Publicado',
        de: 'Veröffentlicht'
      },
      archived: {
        en: 'Archived',
        fr: 'Archivé',
        es: 'Archivado',
        de: 'Archiviert'
      }
    },

    // Help text per value
    enumHelp: {
      draft: {
        en: 'Not yet visible to the public',
        fr: 'Pas encore visible par le public',
        es: 'Aún no visible para el público'
      },
      published: {
        en: 'Visible to everyone',
        fr: 'Visible par tous',
        es: 'Visible para todos'
      },
      archived: {
        en: 'No longer actively displayed',
        fr: 'Affiché plus activement',
        es: 'Ya no se muestra activamente'
      }
    }
  })
}
```

### Dynamic Enum Labels

```typescript
// Get translated label for an enum value
const statusLabel = collections.posts.fields.status.getEnumLabel('published', 'fr')
// Returns: 'Publié'

// Get all enum labels for a locale
const allStatusLabels = collections.posts.fields.status.getAllEnumLabels('es')
// Returns: {
//   draft: 'Borrador',
//   published: 'Publicado',
//   archived: 'Archivado'
// }
```

## Error Message i18n

### Runtime Error Messages

```typescript
// Validation errors are automatically translated
try {
  await collections.users.create({
    data: {
      username: 'ab', // Too short
      email: 'invalid-email'
    }
  })
} catch (error) {
  // Error messages respect the current locale
  if (error.locale === 'fr') {
    // "Le nom d'utilisateur doit comporter au moins 3 caractères"
    // "Adresse email invalide"
  }
}
```

### Setting the Locale for Operations

```typescript
// Set locale for specific operations
const result = await collections.users.create({
  data: { /* ... */ },
  locale: 'fr' // Error messages in French
})

// Set locale globally
collections.users.setLocale('es')
const users = await collections.users.findMany()
// All messages in Spanish
```

## Database i18n

### Multi-Language Content Fields

```typescript
// Store translated content in the database
fields: {
  title: field({
    type: json(z.object({
      en: z.string(),
      fr: z.string().optional(),
      es: z.string().optional(),
      de: z.string().optional()
    })),

    label: {
      en: 'Title',
      fr: 'Titre',
      es: 'Título',
      de: 'Titel'
    }
  }),

  content: field({
    type: json(z.object({
      en: z.string(),
      fr: z.string().optional(),
      es: z.string().optional(),
      de: z.string().optional()
    }))
  })
}
```

### Querying Translations

```typescript
// Get post with title in current locale
const post = await collections.posts.findUnique({
  where: { id: 1 },
  locale: 'fr'
})

// Access translated content
console.log(post.title.fr) // "Titre en français"
console.log(post.content.en) // "Content in English"
```

### Auto-Select Locale Field

```typescript
// Automatically select the correct language
const post = await collections.posts.findUnique({
  where: { id: 1 },
  select: {
    title: { autoLocale: true }, // Returns title[locale] or falls back to default
    content: { autoLocale: true }
  },
  locale: 'fr'
})

// Access directly without specifying locale
console.log(post.title) // Automatically returns French title
```

## Hooks i18n

### Localized Hooks

```typescript
export const posts = collection({
  slug: 'posts',

  hooks: {
    beforeCreate: [
      async ({ data, locale }) => {
        // Access current locale in hooks
        if (locale === 'fr') {
          // French-specific logic
        }
      }
    ],

    afterCreate: [
      async ({ result, locale }) => {
        // Send localized notifications
        const message = localeMessages[locale].postCreated
        await sendNotification(result.authorId, message)
      }
    ]
  }
})
```

## i18n in Plugins

### Adding i18n to Custom Plugins

```typescript
// plugins/slug-plugin.ts
export const slugPlugin = (options: {
  from: string
  messages?: {
    success?: Record<string, string>
    error?: Record<string, string>
  }
}) => ({
  name: 'slug-plugin',

  messages: {
    autoGenerated: {
      en: 'Slug auto-generated from title',
      fr: 'Slug généré automatiquement à partir du titre',
      es: 'Slug generado automáticamente desde el título'
    },
    invalid: {
      en: 'Slug contains invalid characters',
      fr: 'Le slug contient des caractères invalides',
      es: 'El slug contiene caracteres inválidos'
    },
    ...options.messages
  },

  hooks: { /* ... */ }
})

// Usage
collection('posts', {
  plugins: [
    slugPlugin({
      from: 'title',
      messages: {
        success: {
          en: 'Custom success message',
          fr: 'Message de succès personnalisé'
        }
      }
    })
  ]
})
```

## API Response i18n

### Localized API Responses

```typescript
// Hono integration example
app.get('/api/posts/:id', async (c) => {
  const locale = c.req.header('Accept-Language') || 'en'

  const post = await collections.posts.findUnique({
    where: { id: c.req.param('id'),
    locale }
  })

  return c.json({
    data: post,
    // Field labels in requested locale
    meta: {
      fields: collections.posts.getLabels(locale)
    }
  })
})

// Response:
{
  "data": {
    "id": 1,
    "title": "Mon Premier Article",
    "status": "published"
  },
  "meta": {
    "fields": {
      "title": "Titre",
      "status": "Statut",
      "content": "Contenu"
    }
  }
}
```

## Type-Safe Locale Access

### Locale Type Definitions

```typescript
// Automatically typed based on i18n config
type Locale = 'en' | 'fr' | 'es' | 'de'

// Collection methods accept only defined locales
collections.posts.findMany({ locale: 'fr' }) // ✅ OK
collections.posts.findMany({ locale: 'it' }) // ❌ Type error

// Field labels are typed
const label: Record<Locale, string> = {
  en: 'Title',
  fr: 'Titre',
  es: 'Título',
  de: 'Titel'
}
```

## Missing Translations

### Fallback Behavior

```typescript
// When a translation is missing, fallback to default locale
const field = {
  label: {
    en: 'Title',        // Default
    fr: 'Titre',        // Available
    // es: missing, falls back to 'en'
    de: 'Titel'         // Available
  }
}

// Requesting 'es' locale returns 'Title' (default)
const label = collections.posts.fields.title.getLabel('es')
// Returns: 'Title'
```

### Development Warnings

```typescript
// In development mode, warn about missing translations
if (process.env.NODE_ENV === 'development') {
  collections.posts.validateTranslations()
  // Console: "Missing translation for 'posts.fields.title' in locale 'es'"
}
```

## Extracting Translations

### Generate Translation Files

```typescript
// Extract all translations to JSON files
npx deessejs-i18n extract

// Output:
// locales/
//   en.json
//   fr.json
//   es.json
//   de.json

// en.json:
{
  "collections.posts.label": "Blog Posts",
  "collections.posts.fields.title.label": "Title",
  "collections.posts.fields.title.description": "The title of your blog post",
  "collections.posts.fields.title.messages.tooShort": "Title must be at least 3 characters"
}
```

### Import External Translations

```typescript
// Import from external i18n files
import enTranslations from './locales/en.json'
import frTranslations from './locales/fr.json'

export const posts = collection({
  slug: 'posts',

  // Use imported translations
  i18n: {
    en: enTranslations.collections.posts,
    fr: frTranslations.collections.posts
  }
})
```

## Best Practices

### Organize Translations

```typescript
// Separate translation concerns
// collections/users.ts - Data structure
// locales/users.ts - Translations

// collections/users.ts
export const users = collection({
  slug: 'users',
  fields: {
    username: field({ type: text() }),
    email: field({ type: email() })
  }
})

// locales/users.ts
export const userTranslations = {
  en: {
    label: 'User',
    fields: {
      username: {
        label: 'Username',
        description: 'Your unique username'
      },
      email: {
        label: 'Email Address',
        description: 'Your email address'
      }
    }
  },
  fr: { /* ... */ }
}

// Apply translations
export const users = collection({
  slug: 'users',
  i18n: userTranslations
})
```

### Use Translation Keys

```typescript
// Use keys instead of inline translations for better organization
const translationKeys = {
  users: {
    label: 'collections.users.label',
    fields: {
      username: 'collections.users.fields.username.label'
    }
  }
}

// Keys are resolved at runtime
```

### Consistent Locale Formatting

```typescript
// Use standard locale codes (ISO 639-1)
const locales = ['en', 'fr', 'es', 'de', 'ja', 'zh', 'ar']

// Support locale with region codes if needed
const localesWithRegion = ['en-US', 'en-GB', 'fr-FR', 'fr-CA', 'de-DE', 'de-AT']
```

## Benefits of Native i18n

### Type Safety

- All locales are type-checked
- Missing translations caught at compile time
- Autocomplete for available locales

### Zero Dependencies

- No external i18n libraries needed
- Built into the framework
- Lightweight bundle size

### Developer Experience

- Inline translations with your code
- No separate translation files to maintain
- Easy to see what's translated and what's missing

### Performance

- Translations loaded at build time
- No runtime translation lookup overhead
- Tree-shake unused locales
