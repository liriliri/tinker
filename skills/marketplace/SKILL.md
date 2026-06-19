---
description: Add a tinker plugin to the marketplace
argument-hint: <plugin-name>
---

# Add Marketplace Plugin

Add a plugin to the marketplace registry. The plugin package is discovered automatically: search `tinker-plugins/packages/` first, then fall back to `tinker-games/packages/`.

## Arguments

- `plugin-name`: the package directory name without the `tinker-` prefix (e.g., `life-progress`, `2048`)

## Steps

### 1. Locate the plugin package

Search for `tinker-<plugin-name>` in order:

1. `tinker-plugins/packages/tinker-<plugin-name>/package.json`
2. `tinker-games/packages/tinker-<plugin-name>/package.json`

Use the first match as `<pkg-path>`. If neither exists, stop and report the error.

### 2. Read plugin metadata

Read `<pkg-path>/package.json` and extract the `tinker` field (name, description, locales).

### 3. Add entry to marketplace list

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

### 4. Copy icon to resources

```bash
cp <pkg-path>/icon.png resources/marketplace/tinker-<plugin-name>.png
```

### 5. Verify

Confirm the icon file exists and the marketplace list is valid TypeScript (no syntax errors).
