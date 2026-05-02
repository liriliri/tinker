---
description: Add a tinker-plugins plugin to the marketplace
argument-hint: <plugin-name>
---

# Add Marketplace Plugin

Add a plugin from `tinker-plugins/packages/` to the marketplace registry.

## Arguments

- `plugin-name`: the package directory name without the `tinker-` prefix (e.g., `life-progress`)

## Steps

### 1. Read plugin metadata

Read `tinker-plugins/packages/tinker-<plugin-name>/package.json` and extract the `tinker` field (name, description, locales).

### 2. Add entry to marketplace list

Edit `src/main/lib/plugin/marketplace.ts` and insert a new entry into the `marketplacePlugins` array in alphabetical order by `id`. Use the format:

```ts
{
  id: 'tinker-<plugin-name>',
  name: '<tinker.name from package.json>',
  description: '<tinker.description from package.json>',
  icon: 'tinker-<plugin-name>.png',
  locales: {
    'zh-CN': {
      name: '<tinker.locales.zh-CN.name>',
      description: '<tinker.locales.zh-CN.description>',
    },
  },
},
```

### 3. Copy icon to resources

```bash
cp tinker-plugins/packages/tinker-<plugin-name>/icon.png resources/marketplace/tinker-<plugin-name>.png
```

### 4. Verify

Confirm the icon file exists and the marketplace list is valid TypeScript (no syntax errors).
