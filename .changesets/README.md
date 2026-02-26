# Changesets

This directory contains changesets for versioning and publishing.

## Usage

```bash
# Create a changeset
pnpm changeset

# Version bump
pnpm version

# Publish
pnpm release
```

## Adding Changes

Run `pnpm changeset` to create a new changeset. This will prompt you to:
1. Select which packages have changed
2. Select the type of change (major, minor, patch)
3. Write a description of the change

Changesets will be consumed during the release process to generate changelogs and update version numbers.
