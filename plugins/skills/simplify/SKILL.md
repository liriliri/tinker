---
description: Review changed code for reuse, quality, and efficiency, then fix any issues found.
argument-hint: <plugin-name-or-file-path>
---

# Simplify Plugin Code

Review a Tinker plugin's source code for redundant, dead, or duplicated code, then fix all issues found.

## Arguments

- `plugin-name-or-file-path`: plugin folder name (e.g. `tinker-hash`) or one or more specific file paths

## Checklist

Read all target files and check for the following categories of redundancy:

### 1. Unused Exports

- Constants, functions, types, or interfaces that are exported but never imported anywhere in the plugin
- Variables declared but never read

### 2. Dead Code

- Unreachable code after `return`, `throw`, or `break`
- Branches or `switch` cases that can never execute given the existing logic (e.g. a handler registered before a special-case check that already covers the same path)
- Code guarded by a condition that is always `true` or always `false`

### 3. Duplicate Logic

- Functions with identical or near-identical bodies that could be merged into one
- The same expression or block repeated in two or more places that could be extracted into a shared helper or hook

### 4. Duplicate Type Definitions

- Interfaces or types with identical shapes defined more than once
- Type aliases that simply re-export another type without adding meaning

### 5. Repeated Inline Patterns

- Identical JSX subtrees copy-pasted across components
- Identical event handler logic inline in multiple components

### 6. Unused i18n Keys

- Keys defined in `src/i18n/locales/*.json` that are never referenced via `t('key')` anywhere in the plugin's `.ts`/`.tsx` files
- Check both locale files (`en-US.json` and `zh-CN.json`) — a key is unused only if it is absent from **all** `t()` calls across the entire plugin source

## Output Format

For each issue found, output:

```
[Category] file/path:line — description
```

Example:
```
[Unused] src/lib/constants.ts:40 — SUPPORTED_EXTENSIONS is exported but never imported
[Dead Code] src/lib/ffmpegArgs.ts:22 — case 'gif' in getVideoCodecArgs is unreachable; caller handles gif before invoking this function
[Duplicate Logic] src/components/MediaList.tsx:50,158 — handleContextMenu is identical in ImageCard and MediaRow; extract to a shared hook
[Duplicate Type] src/components/MediaList.tsx:43,151 — MediaItemProps and MediaRowProps are identical; remove one
[i18n] src/i18n/locales/en-US.json:12 — key "outputDir" is defined but never used via t()
```

If no issues are found, report: **No redundancies found.**

## Steps

1. Identify the target:
   - If a plugin name is given, glob all `.ts`, `.tsx`, and `.json` files under `<plugin-name>/src/`
   - If file paths are given, read those files; also read the i18n locale files for i18n key checks
2. Read all target files thoroughly.
3. Cross-reference exports against imports across all files in the plugin to detect unused exports.
4. For i18n keys: collect every key from both locale JSON files, then grep all `.ts`/`.tsx` files for `t('key')` calls. Any key not found in any call is unused.
5. Apply each checklist item and collect all findings.
5. Report all findings grouped by category with file path and line number.
6. Fix every issue found by editing the relevant files. Do not skip any issue.
7. After fixing, verify there are no TypeScript errors by checking IDE diagnostics or re-reading the changed files.
