---
description: Check code against Tinker plugin coding standards
argument-hint: <plugin-name-or-file-path>
---

# Lint Plugin Code

Review a Tinker plugin's source code and report any violations of the project's coding standards defined in `AGENTS.md`.

## Arguments

- `plugin-name-or-file-path`: plugin folder name (e.g. `tinker-hash`) or a specific file path to check

## Checklist

Go through each category below and report violations with file path and line number.

### 1. Naming Conventions

- Plugin folder: kebab-case with `tinker-` prefix
- Component files: PascalCase (e.g. `Toolbar.tsx`)
- Store file: `store.ts` (lowercase)
- Style file: `index.scss`
- React components: PascalCase identifiers (`const Toolbar = observer(...)`)
- Functions/variables: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/interfaces: PascalCase
- **Exception**: If a component name would conflict with an imported identifier (e.g. a local `Toolbar` component that also imports `Toolbar` from `share/components/Toolbar`), suffix the local component with `Component` (e.g. `ToolbarComponent`). This is intentional and should NOT be reported as a violation.

### 2. Store Structure

- Store class must extend `BaseStore` from `share/BaseStore`
- Constructor must call `super()` before `makeAutoObservable(this)`
- Export a singleton instance: `export default new Store()`

### 3. Theme & Colors

- Never hardcode literal color values (e.g. `#0fc25e`, `#e0e0e0`, `rgb(...)`)
- Tailwind color classes (e.g. `bg-green-500`, `text-gray-800`) are allowed
- Always use `tw.*` utilities from `share/theme` for theme-aware colors (primary, border, background, etc.)
- Import must be: `import { tw, THEME_COLORS } from 'share/theme'`

### 4. Component Patterns

- Components that access store must be wrapped with `observer()`
- All component props must have an interface definition
- Avoid creating new objects/arrays inline in JSX render — use MobX computed properties

### 5. Library and Utilities (`lib/` directory)

- External wrappers, utility functions, business logic must live in `src/lib/`
- Forbidden directory names for utilities: `src/utils/`, `src/helpers/`
- Logic in `store.ts` that has no dependency on store state or MobX should be extracted to `src/lib/`. Candidates: pure functions, data transformation, algorithm helpers, API wrappers
- Never create `src/lib/index.ts` as a catch-all. Name files by their purpose (e.g. `util.ts`, `math.ts`). When unsure of the name, use `lib/util.ts`

### 6. TypeScript

- No `any` types — use proper types or union types
- Types/interfaces referenced in more than one file must be extracted:
  - Plugins with `src/renderer/` directory: extract to `src/renderer/types.ts`
  - Simple plugins without `src/renderer/` directory: extract to `src/types.ts`
  - Types/interfaces shared between `preload` and `renderer` must be extracted to `src/common/types.ts`
- Each file must import types directly from the source file where they are defined — **never import a type just to re-export it** (e.g. `import type { Foo } from './types'; export type { Foo }` in an unrelated file is forbidden)

### 7. Internationalization

- UI strings must use `t()` from `react-i18next`, not hardcoded strings
- i18n files must exist: `src/i18n/index.ts`, `src/i18n/locales/en-US.json`, `src/i18n/locales/zh-CN.json`

### 8. Code Comments

- All comments must be in English
- No redundant comments that restate what the code does (e.g. `// Set loading state` before `this.isLoading = true`)
- Comments should explain "why", not "what"

### 9. SCSS Usage

- SCSS (`index.scss`) should only be used for third-party library style overrides
- Application styles must use Tailwind CSS classes
- Hardcoded colors inside third-party library style overrides in SCSS are allowed

### 10. Icons

- Use `lucide-react` for icons: `import { Copy } from 'lucide-react'`
- Custom SVG: `import Icon from '../assets/icon.svg?react'`
- Toolbar icons must use the `TOOLBAR_ICON_SIZE` constant

## Output Format

For each violation found, output:

```
[Category] file/path:line — description of violation
```

Example:
```
[Theme] src/components/Toolbar.tsx:12 — hardcoded color `#0fc25e`, use tw.primary.bg instead
[Naming] src/components/toolbar.tsx — component file should be PascalCase: Toolbar.tsx
[Store] src/store.ts:5 — Store must extend BaseStore from share/BaseStore
[Comments] src/App.tsx:34 — comment in Chinese, must use English
```

If no violations are found, report: **No violations found.**

## Steps

1. Identify the target: if a plugin name is given, glob all `.ts`, `.tsx`, `.scss` files under `<plugin-name>/src/`. If a file path is given, check that file only.
2. Read each file and check against the checklist above.
3. Report all violations grouped by category, including total violation count and which categories had issues.
4. Run prettier and eslint on the plugin (replace `<plugin-name>` with the actual folder name):

**IMPORTANT**:
- `lsla` is a **global command** — use it directly, do NOT use `npx prettier`
- `eslint` lives at the **Tinker monorepo root** (`../node_modules/.bin/eslint` relative to the current workspace) — do NOT look elsewhere, do NOT use `npx eslint`
- Both commands must run from the **Tinker monorepo root** (`../` relative to the current workspace). Plugins live under `plugins/` at that root.

```bash
cd .. && lsla prettier "plugins/<plugin-name>/src/**/*.{ts,tsx,json,scss}" --write
cd .. && node_modules/.bin/eslint "plugins/<plugin-name>/src/**/*.{ts,tsx}"
```

If eslint reports errors, fix them by editing the relevant files, then re-run eslint to confirm all errors are resolved.

5. Run the build to ensure there are no compilation errors (run from the plugin directory in the current workspace):

```bash
cd <plugin-name> && npm run build
```

If the build fails, fix the errors, then re-run the build to confirm it succeeds.

6. Run TypeScript type checking (run from the plugin directory in the current workspace):

```bash
cd <plugin-name> && npx tsc --noEmit
```

**IMPORTANT**: Only fix errors in files that are tracked by git. Never touch files under `references/` directories or any file listed in `.gitignore` — these are reference materials only.

If there are TypeScript errors, fix them, then re-run to confirm all errors are resolved.
