---
name: mcp
description: Implement or audit MCP tools for a Tinker plugin. Use when adding MCP support, writing src/mcp.ts, defining tinker.mcp.tools in package.json, reviewing plugin MCP conventions, or checking whether an MCP implementation follows project standards.
argument-hint: <plugin-name>
---

# Plugin MCP

Implement and review MCP tools for Tinker plugins. Tool schemas live in `package.json`; runtime handlers live in `src/mcp.ts`; serialization is centralized in `share/lib/mcp.ts`.

## Arguments

- `plugin-name`: plugin folder name (e.g. `tinker-image-compressor`, `image-compressor`)

## References

| Plugin                                 | Pattern                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `share/lib/mcp.ts`                     | `registerPluginMcp`, `formatMcpToolResult`, types         |
| `tinker-image-compressor`              | Single end-to-end tool (`compress_images`)                |
| `tinker-image-cropper`                 | Multi-step workflow: `open_image` → edit → `save_image`   |
| `tinker-todo` / `tinker-anniversary`   | CRUD-style multi-tool                                     |
| `tinker-json-editor` / `tinker-regexp` | Read/write editor tools                                   |
| `resources/skills/mcp/SKILL.md`        | End-user CLI: `tinker call`, `tinker mcp`, `tinker tools` |

## Tool design

Pick granularity by plugin shape — not by toolbar button count.

| Pattern             | When                                                     | Example tools                                                         |
| ------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- |
| **End-to-end**      | Batch operation with no required intermediate inspection | `compress_images`                                                     |
| **Workflow stages** | Agent must read state before the next step               | `open_image`, `get_image`, `crop_image`, `resize_image`, `save_image` |
| **CRUD / editor**   | Natural read/write/update/delete model                   | `get_todos`, `add_todo`, `get_json`, `set_json`                       |

**Do** split by workflow stage when the agent needs dimensions, file state, or confirmation between steps.

**Don't** expose one MCP tool per toolbar control (rotate, flip, undo, aspect-ratio picker) unless explicitly requested.

Rotation/flip and other cropper UI controls are **not** MCP tools today; MCP covers open → crop/resize → save.

## Implement MCP

### 1. Define tools in `package.json`

Under `tinker.mcp.tools`, each tool needs:

- `description` — what the tool does for agents; mention prerequisites (`Call open_image first…`)
- `inputSchema` (optional) — JSON Schema validated by CLI before `callTool`

Tool names: `snake_case`. Put type/range/required constraints in `inputSchema`. Do **not** duplicate them in `mcp.ts`.

Cross-field rules the schema cannot express (e.g. `outputPath` required when `overwriteOriginal` is false and the value falls back to store defaults) stay in the handler.

### 2. Create `src/mcp.ts`

```ts
import {
  createPluginMcpApi,
  formatMcpError,
  type PluginMcp,
} from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    my_tool: myTool,
  })
}

async function myTool(store: Store, args: Record<string, unknown>) {
  try {
    return { ok: true }
  } catch (error) {
    return formatMcpError(error, 'Operation failed')
  }
}
```

Optional: export `getToolArgSummary(name, args)` when the plugin uses AiChat and needs short tool-arg previews (`tinker-regexp`, `tinker-json-editor`).

### 3. Wire store (minimal change)

```ts
import { createMcpApi } from './mcp'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)
}
```

Handlers call **existing** store APIs the UI already uses. Do not add store methods solely for MCP unless the UI would need the same headless path (e.g. optional `saveImage(outputPath?)` / `saveAll(outputDirectory?)` for non-overwrite saves).

Canvas/ffmpeg logic that only exists in UI event handlers may live in `mcp.ts` when it mirrors the same store calls afterward (`setCroppedImage` + `applyCroppedImage`).

### 4. Handler rules

| Do                                                 | Don't                                                       |
| -------------------------------------------------- | ----------------------------------------------------------- |
| Return `string` for errors (`Error: ...`)          | `JSON.stringify` in plugin — host `registerMcp` serializes |
| Return plain objects for structured success        | Redundant return-type annotations on handlers               |
| Use async handlers when needed                     | Cast `Record<string, unknown>` to a typed args interface    |
| Extract args with per-field casts + store defaults | One monolithic tool when stages need intermediate reads     |

Shared state helpers (e.g. `serializeImage`) may return plain objects for spreading into tool responses.

Extract args example:

```ts
const quality = (args.quality as number | undefined) ?? store.quality
```

### 5. Verify

```bash
cd <plugin-name> && npm run build
cd <plugin-name> && npx tsc --noEmit 2>&1 | rg "mcp\.ts" || true
```

Then (Tinker running):

```bash
tinker open <plugin>
tinker tools <plugin>
tinker call <plugin> --tool <name> --args '{}'
```

Run the **lint** skill on changed files after implementation.

## Audit MCP

Read `<plugin-name>/package.json`, `src/mcp.ts`, and `src/store.ts`. Report violations as:

```
[Category] file/path:line — description
```

### Checklist

**Schema** — tools defined; descriptions present; `inputSchema` matches `args` field names; prerequisites documented in descriptions.

**Structure** — `createMcpApi` + `createPluginMcpApi` handler map; tool names match `package.json`; unknown tools return `Error: Unknown tool`.

**Store** — `export class Store`; `readonly mcp = createMcpApi(() => this)`.

**Handlers** — existing store methods; no `JSON.stringify`; no redundant schema validation; runtime checks for file existence and conditional required paths.

**Types** — no full-args interface cast on handler `args`.

**Design** — granularity matches plugin shape (end-to-end / workflow stages / CRUD); not one tool per toolbar button; store changes minimal.

### Output

If no violations: **No MCP violations found.**

Otherwise list violations by category with total count.

## Decision guide

```
Automate plugin?
├─ Batch, no intermediate inspection → one end-to-end tool (compressor)
├─ Agent must read size/state before editing → workflow stages (cropper)
├─ CRUD / editor → focused read/write tools (todo, json-editor)
└─ Missing headless save path → optional outputPath on existing save method only
```

## Common fixes

| Violation                                  | Fix                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Manual `JSON.stringify`                    | Return object; `tinker.registerMcp` serializes for the host bridge            |
| `executeTool`: `string \| Promise<string>` | Handlers return object or `Error: ...` string; host serializes                |
| Spread error on serialize helper           | Return a plain object from the helper                                         |
| `args as FooArgs` on full args object      | Per-field casts: `args.path as string`                                        |
| Toolbar button as MCP tool                 | Merge into workflow stage or skip                                             |
| Headless save blocked by dialog            | Add optional path arg to existing `save*` method                              |
