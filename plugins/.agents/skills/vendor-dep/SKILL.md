---
name: vendor-dep
description: Extract a npm dependency into the shared vendor bundle
argument-hint: <package-name> <global-camel-name> <plugin-name> [plugin-name2 ...]
---

# Vendor Dep

Extract a plugin's npm dependency into the shared `vendor/` bundle so it can be reused across plugins.

## Arguments

- `package-name`: the npm package name (e.g. `html-to-image`)
- `global-camel-name`: camelCase name for `globalThis` and IIFE export (e.g. `htmlToImage`)
- `plugin-name`: one or more plugin folder names that use this dependency (e.g. `tinker-code-image tinker-photo-collage`)

The vendor entry file name and build mode/script name are derived from `global-camel-name` lowercased (e.g. `htmltoimage`).

## Steps

### 1. Derive names

- `lowerName` = `global-camel-name` lowercased (e.g. `htmlToImage` → `htmltoimage`)
- `pluginVendorName` = `PluginVendor` + PascalCase of `global-camel-name` (e.g. `PluginVendorHtmlToImage`)

### 2. Create vendor entry file

First check how the plugin imports the package:

- **Named exports** (`import { foo } from '...'` or `import * as foo from '...'`): use `import *`
- **Default export** (`import Foo from '...'`): use default import

Create `vendor/<lowerName>.ts`:

**Named exports:**
```ts
import * as <global-camel-name> from '<package-name>'
import { expose } from './util'

expose('<global-camel-name>', <global-camel-name>)

export { <global-camel-name> }
```

**Default export:**
```ts
import <global-camel-name> from '<package-name>'
import { expose } from './util'

expose('<global-camel-name>', <global-camel-name>)

export default <global-camel-name>
```

### 3. Update `vendor/vite.config.ts`

**Add to `globals` map:**

```ts
'<package-name>': '<global-camel-name>',
```

**Add build target** (before the final `return createConfig('react', ...)`):

```ts
if (target === '<lowerName>') {
  return createConfig('<lowerName>', '<pluginVendorName>')
}
```

### 4. Update `vendor/package.json`

**Add to `devDependencies`:**

```json
"<package-name>": "<version>"
```

Use the same version string currently in the plugin's `package.json`. Renderer libraries must always be installed as `devDependencies`, never `dependencies`.

**Add build script:**

```json
"build:<lowerName>": "vite build --config vite.config.ts --mode <lowerName>"
```

**Append to `build` script chain:**

```
&& npm run build:<lowerName>
```

### 5. Remove from each plugin's `package.json`

For each `<plugin-name>`, remove `<package-name>` from `devDependencies`. If `devDependencies` becomes empty, keep the key with an empty object `{}`.

### 6. Add vendor script to each plugin's `index.html`

For each `<plugin-name>`, add the following `<script>` tag in `<head>` after existing vendor scripts:

```html
<script src="/vendor/<lowerName>.js"></script>
```
