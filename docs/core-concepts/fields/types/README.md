# Field Types

Learn about all available field types in @deessejs/collections.

## Overview

Field types define the shape of your data. Each field has:
- A TypeScript type (via Zod)
- A database column type
- Optional validation and constraints

## Categories

### Field Type Factory
- [Factory `f`](./factory.md) - Predefined field types
- [Custom Field Types](./custom.md) - Create your own field types

### Primitive Types
- [Text](./primitives/text.md)
- [Number](./primitives/number.md)
- [Boolean](./primitives/boolean.md)
- [Date](./primitives/date.md)

### Specialized Types
- [Email](./specialized/email.md)
- [URL](./specialized/url.md)
- [Select](./specialized/select.md)
- [JSON](./specialized/json.md)
- [Array](./specialized/array.md)
- [Rich Text](./specialized/richtext.md)
- [File](./specialized/file.md)

### Relations
- [Relations](./relations.md)

### Configuration
- [Field Options](./options.md)
- [Auto-Generated Fields](./auto-generated.md)
- [Validation vs Database Constraints](./validation.md)
