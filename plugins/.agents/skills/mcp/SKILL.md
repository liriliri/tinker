---
name: mcp
description: Implement or audit MCP tools for a Tinker plugin. Use when adding MCP support, writing src/mcp.ts, defining tinker.mcp.tools in package.json, reviewing plugin MCP conventions, or checking whether an MCP implementation follows project standards.
argument-hint: <plugin-name>
---

# Plugin MCP

Schemas in `package.json` (`tinker.mcp.tools`); handlers in `src/mcp.ts`; shared helpers in `share/lib/mcp.ts`.

## Arguments

- `plugin-name`: plugin folder name (e.g. `tinker-image-compressor`, `image-compressor`)

## References

| Plugin / path                              | Pattern                                                   |
| ------------------------------------------ | --------------------------------------------------------- |
| `share/lib/mcp.ts`                         | `createPluginMcpApi`, `formatMcpToolResult`, types        |
| `tinker-image-compressor`                  | End-to-end (`compress`)                                   |
| `tinker-image-cropper`                     | Workflow: `open` → edit → `save`                          |
| `tinker-todo` / `tinker-anniversary`       | CRUD                                                      |
| `tinker-json-editor` / `tinker-regexp`     | Read/write editor                                         |
| `.agents/skills/tinker-dev/SKILL.md`       | Dev CLI in this repo: `./bin/tinker-dev` (not packaged `tinker`) |
| `resources/skills/mcp/SKILL.md`            | Packaged CLI docs (`tinker call` / `tools` / `mcp`); map to `tinker-dev` here |

## Tool design

Pick granularity by plugin shape — not by toolbar button count.

| Pattern             | When                                                     | Examples                                      |
| ------------------- | -------------------------------------------------------- | --------------------------------------------- |
| **End-to-end**      | Batch, no required intermediate inspection               | `compress`                                    |
| **Workflow stages** | Agent must read state before the next step               | `open`, `get`, `crop`, `resize`, `save`       |
| **CRUD / editor**   | Natural read/write/update/delete model                   | `list`, `add`, `get`, `set`                   |

Don't expose one MCP tool per toolbar control (e.g. cropper rotate/flip/undo). If headless save is blocked by a dialog, add an optional path arg to the existing `save*` method — don't invent a separate MCP-only API.

## Implement

### 1. `package.json`

Under `tinker.mcp.tools`:

- `description` — for agents; note prerequisites (`Call open first…`)
- `inputSchema` (optional) — JSON Schema; CLI validates before `callTool`

Tool names: `snake_case`. Put type/range/required constraints in `inputSchema` — do **not** re-validate them in `mcp.ts`. Cross-field rules the schema can't express stay in the handler.

### 2. `src/mcp.ts`

```ts
import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import type { Store } from './store'
import pkg from '../package.json'

interface MyToolArgs {
  path: string
  quality?: number
}

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    my_tool: myTool,
  })
}

async function myTool(store: Store, args: MyToolArgs) {
  if (!store.ready) {
    throw new Error('Not ready. Call open first.')
  }
  const quality = args.quality ?? store.quality
  return { ok: true, path: args.path, quality }
}
```

Optional: export `getToolArgSummary(name, args)` for AiChat tool-arg previews when the default (`command` / `content` / `path` / …) is not enough. Return the full string — `ToolCard` truncates in the UI (`tinker-regexp`).

### 3. Wire store

```ts
import { createMcpApi } from './mcp'

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)
}
```

Call existing store APIs. Don't add store methods solely for MCP unless the UI would need the same headless path. Canvas/ffmpeg that only lives in UI handlers may sit in `mcp.ts` when it still ends in the same store calls (`setCroppedImage` + `applyCroppedImage`).

### 4. Handler rules

| Do                                                 | Don't                                                    |
| -------------------------------------------------- | -------------------------------------------------------- |
| `throw new Error(...)` for failures                | Return `'Error: ...'` strings / catch-and-return         |
| Return plain objects for success                   | `JSON.stringify` — host `registerMcp` serializes         |
| Typed args interface + store defaults for optionals | Cast individual fields from `Record<string, unknown>`   |
| Async when needed                                  | Redundant return-type annotations                        |

Host and AiChat catch thrown errors and format them as `Error: ...` (AiChat also marks the tool as `error`). CLI validates `inputSchema` before `callTool`, so required fields can be typed as required.

```ts
const quality = args.quality ?? store.quality
```

### 5. Verify

```bash
cd <plugin-name> && npm run build
cd <plugin-name> && npx tsc --noEmit 2>&1 | rg "mcp\.ts" || true
```

Live tool checks in this repo must use **`./bin/tinker-dev`** from the tinker-utm root (see `.agents/skills/tinker-dev/SKILL.md`). Do **not** use the packaged `tinker` CLI while developing here.

```bash
# from tinker-utm repo root
./bin/tinker-dev open <plugin>
./bin/tinker-dev tools <plugin>
./bin/tinker-dev call <plugin> --tool <name> --args '{}'
```

MCP registers after the plugin window finishes loading; if `call` fails with "not ready", wait briefly and retry.

Run the **lint** skill on changed files afterward.

## Audit

Read `<plugin-name>/package.json`, `src/mcp.ts`, and `src/store.ts`. Check against the Implement rules above (schema ↔ args, handler map ↔ tool names, store wiring, throw-not-return errors, no JSON.stringify, design granularity).

Report:

```
[Category] file/path:line — description
```

If clean: **No MCP violations found.** Otherwise list by category with total count.
