---
name: lint
description: Check code against Tinker plugin coding standards
argument-hint: <plugin-name-or-file-path>
---

# Lint Plugin Code

Check a Tinker plugin against `AGENTS.md` standards. Report every violation with path and line.

## Arguments

- `plugin-name-or-file-path`: plugin folder (e.g. `tinker-hash`) or a specific file

## Checklist

### 1. Naming

- Plugin folder: `tinker-` + kebab-case
- Components: PascalCase files/ids (`Toolbar.tsx`, `const Toolbar = observer(...)`)
- `store.ts`, `index.scss` (lowercase)
- Functions/vars: camelCase; constants: UPPER_SNAKE_CASE; types: PascalCase
- **Exception (do not flag)**: local component colliding with an import may use `Component` suffix (e.g. `ToolbarComponent`)

### 2. Store

- Extends `BaseStore` from `share/store/Base`
- `super()` before `makeAutoObservable(this)`
- Singleton: `export default new Store()`

### 3. Theme & Colors

- No hardcoded colors (`#…`, `rgb(…)`, etc.); Tailwind palette classes OK
- Theme colors via `tw.*` / `THEME_COLORS` from `share/theme`
- Import form: `import { tw, THEME_COLORS } from 'share/theme'`

### 4. Components

- Store access → wrap with `observer()`
- Props need an interface
- No inline object/array creation in JSX render — prefer MobX computed

### 5. `lib/`

- Utils / wrappers / non-UI business logic → `src/lib/` (not `utils/` or `helpers/`)
- Pure logic in `store.ts` (no store/MobX dependency) → move to `lib/`
- No `src/lib/index.ts` barrel; name by purpose (`util.ts`, `math.ts`; default to `lib/util.ts` if unsure)
- Small helpers go in `lib/util.ts`; new `lib/*.ts` only for a substantial domain (e.g. PDF export)

### 6. Hooks

- Custom hooks in `src/hooks/` or `src/renderer/hooks/`, not `lib/`

### 7. TypeScript

- No `any`
- Multi-file types: `src/renderer/types.ts` (if `src/renderer/` exists), else `src/types.ts`; preload+renderer shared → `src/common/types.ts`
- Import types from their defining file — never re-export through an unrelated file

### 8. i18n

- UI copy via `t()`; files: `src/i18n/en-US.json`, `zh-CN.json`
- Keys: camelCase only (no `.` / symbols)

### 9. Comments

- English only
- Explain **why**, never **what** (flag e.g. `// Set loading` above `this.isLoading = true`)

### 10. SCSS

- `index.scss` only for third-party overrides; app UI uses Tailwind
- Hardcoded colors allowed only inside those third-party overrides

### 11. Icons

- `lucide-react` (or `*.svg?react` for custom)
- Toolbar icons: `TOOLBAR_ICON_SIZE`

## Output

```
[Category] file/path:line — description
```

Examples: `[Theme] …`, `[Naming] …`, `[Store] …`, `[Library] …`, `[Comments] …`

If clean: **No violations found.**

Also report total count and which categories failed.

## Steps

1. Target = all `src/**/*.{ts,tsx,scss}` under the plugin, or the given file only.
2. Read and check every checklist item.
3. Report violations, then fix tooling issues as below.
4. From **Tinker monorepo root** (`../` from `plugins/`):

```bash
cd .. && lsla prettier "plugins/<plugin-name>/src/**/*.{ts,tsx,json,scss}" --write
cd .. && node_modules/.bin/eslint "plugins/<plugin-name>/src/**/*.{ts,tsx}"
```

- Use global `lsla` (not `npx prettier`); eslint at repo-root `node_modules/.bin/eslint` (not `npx eslint`)
- Fix eslint errors and re-run until clean

5. From the plugin dir: `npm run build` — fix until it succeeds.
6. From the plugin dir: `npx tsc --noEmit` — fix until clean.

**Only fix git-tracked files.** Never edit `references/` or `.gitignore`d files.
