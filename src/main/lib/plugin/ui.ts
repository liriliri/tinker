import { createRequire } from 'module'
import path from 'path'
import { chromium, type Browser } from 'playwright-core'
import { getUserDataPath } from 'share/main/lib/util'
import { pluginViews, startPluginInspectForRunning } from './view'
import { getPluginInspectHttpUrl, onPluginInspectStop } from './inspect'

const require = createRequire(__filename)
// Playwright ships BrowserBackend via coreBundle (not a public package export).
const pwTools = require('playwright-core/lib/coreBundle').tools as {
  BrowserBackend: any
  browserTools: any[]
  generateHelpJSON: () => {
    commands: Record<
      string,
      {
        args: string[]
        flags: Record<string, 'boolean' | 'string'>
        raw?: boolean
      }
    >
    booleanOptions: string[]
  }
  parseResponse: (result: any) => { text?: string; isError?: boolean }
}

const { BrowserBackend, browserTools, generateHelpJSON, parseResponse } =
  pwTools

/**
 * CLI→tool map adapted from Playwright
 * packages/playwright-core/src/tools/cli-daemon/commands.ts (playwright-core ^1.62).
 * Scoped to attached plugin windows — no browser navigation, tabs, storage
 * state, network mocking, video/tracing, or debugger stepping.
 */

type CliArgs = Record<string, any>
type ToolRef = string | ((args: CliArgs) => string)
type CommandSpec = {
  tool: ToolRef
  params?: (args: CliArgs) => Record<string, unknown>
}

function pick(args: CliArgs, keys: string[]) {
  const out: Record<string, unknown> = {}
  for (const key of keys) {
    if (args[key] !== undefined) out[key] = args[key]
  }
  return out
}

function requestPart(part: string): CommandSpec {
  return {
    tool: 'browser_network_request',
    params: (a) => ({
      index: a.index,
      part,
      filename: a.filename,
    }),
  }
}

const commands: Record<string, CommandSpec> = {
  reload: { tool: 'browser_reload' },
  snapshot: {
    tool: 'browser_snapshot',
    params: (a) => pick(a, ['filename', 'target', 'depth', 'boxes']),
  },
  find: { tool: 'browser_find', params: (a) => pick(a, ['text', 'regex']) },
  eval: {
    tool: 'browser_evaluate',
    params: (a) => ({
      function: a.func,
      target: a.target,
      filename: a.filename,
    }),
  },
  resize: {
    tool: 'browser_resize',
    params: (a) => ({ width: a.w, height: a.h }),
  },
  'run-code': {
    tool: 'browser_run_code_unsafe',
    params: (a) => pick(a, ['code', 'filename']),
  },

  click: {
    tool: 'browser_click',
    params: (a) => pick(a, ['target', 'button', 'modifiers']),
  },
  dblclick: {
    tool: 'browser_click',
    params: (a) => ({
      ...pick(a, ['target', 'button', 'modifiers']),
      doubleClick: true,
    }),
  },
  fill: {
    tool: 'browser_type',
    params: (a) => pick(a, ['target', 'text', 'submit']),
  },
  type: {
    tool: 'browser_press_sequentially',
    params: (a) => pick(a, ['text', 'submit']),
  },
  press: { tool: 'browser_press_key', params: (a) => pick(a, ['key']) },
  keydown: { tool: 'browser_keydown', params: (a) => pick(a, ['key']) },
  keyup: { tool: 'browser_keyup', params: (a) => pick(a, ['key']) },
  hover: { tool: 'browser_hover', params: (a) => pick(a, ['target']) },
  check: { tool: 'browser_check', params: (a) => pick(a, ['target']) },
  uncheck: { tool: 'browser_uncheck', params: (a) => pick(a, ['target']) },
  select: {
    tool: 'browser_select_option',
    params: (a) => ({ target: a.target, values: [a.val] }),
  },
  drag: {
    tool: 'browser_drag',
    params: (a) => pick(a, ['startTarget', 'endTarget']),
  },
  drop: {
    tool: 'browser_drop',
    params: (a) => {
      let data: Record<string, string> | undefined
      if (a.data) {
        data = {}
        for (const entry of a.data as string[]) {
          const idx = entry.indexOf('=')
          if (idx === -1) {
            throw new Error(
              `--data must be in "mime/type=value" format, got: ${entry}`
            )
          }
          data[entry.slice(0, idx)] = entry.slice(idx + 1)
        }
      }
      return { target: a.target, paths: a.path, data }
    },
  },
  upload: {
    tool: 'browser_file_upload',
    params: (a) => ({ paths: a.files }),
  },

  mousemove: {
    tool: 'browser_mouse_move_xy',
    params: (a) => pick(a, ['x', 'y']),
  },
  mousedown: {
    tool: 'browser_mouse_down',
    params: (a) => pick(a, ['button']),
  },
  mouseup: { tool: 'browser_mouse_up', params: (a) => pick(a, ['button']) },
  mousewheel: {
    tool: 'browser_mouse_wheel',
    params: (a) => ({ deltaX: a.dx, deltaY: a.dy }),
  },

  'dialog-accept': {
    tool: 'browser_handle_dialog',
    params: (a) => ({ accept: true, promptText: a.prompt }),
  },
  'dialog-dismiss': {
    tool: 'browser_handle_dialog',
    params: () => ({ accept: false }),
  },
  'generate-locator': {
    tool: 'browser_generate_locator',
    params: (a) => pick(a, ['target']),
  },
  highlight: {
    tool: (a) => (a.hide ? 'browser_hide_highlight' : 'browser_highlight'),
    params: (a) => pick(a, ['target', 'style']),
  },

  console: {
    tool: (a) =>
      a.clear ? 'browser_console_clear' : 'browser_console_messages',
    params: (a) => (a.clear ? {} : { level: a['min-level'] }),
  },
  requests: {
    tool: (a) =>
      a.clear ? 'browser_network_clear' : 'browser_network_requests',
    params: (a) => (a.clear ? {} : { static: a.static, filter: a.filter }),
  },
  request: {
    tool: 'browser_network_request',
    params: (a) => pick(a, ['index', 'filename']),
  },
  'request-headers': requestPart('request-headers'),
  'request-body': requestPart('request-body'),
  'response-headers': requestPart('response-headers'),
  'response-body': requestPart('response-body'),

  screenshot: {
    tool: 'browser_take_screenshot',
    params: (a) => ({
      filename: a.filename,
      target: a.target,
      type: a.type,
      fullPage: a['full-page'],
      scale: a.hires ? 'device' : undefined,
    }),
  },
}

const uiCommandNames = Object.keys(commands).sort()

function resolveUiCommand(
  action: string,
  args: CliArgs
): { toolName: string; toolParams: Record<string, unknown> } {
  const spec = commands[action]
  if (!spec) {
    throw new Error(
      `Unknown ui action: ${action}. Supported: ${uiCommandNames.join(', ')}`
    )
  }
  const toolName = typeof spec.tool === 'function' ? spec.tool(args) : spec.tool
  return {
    toolName,
    toolParams: spec.params ? spec.params(args) : {},
  }
}

interface UiSession {
  pluginId: string
  browser: Browser
  backend: {
    initialize: (clientInfo: {
      cwd: string
      clientName: string
    }) => Promise<void>
    callTool: (
      name: string,
      args: Record<string, unknown>,
      signal?: AbortSignal
    ) => Promise<{
      content: Array<{ type: string; text?: string }>
      isError?: boolean
    }>
    dispose: () => Promise<void>
  }
}

const sessions = new Map<string, UiSession>()
const connecting = new Map<string, Promise<UiSession>>()
const helpJson = generateHelpJSON()

onPluginInspectStop((pluginId) => {
  void disposeUiSession(pluginId)
})

function snapshotDir(pluginId: string) {
  return getUserDataPath(path.join('data', 'ui', pluginId))
}

async function ensureInspect(pluginId: string) {
  const existing = getPluginInspectHttpUrl(pluginId)
  if (existing) {
    return existing
  }
  await startPluginInspectForRunning(pluginId)
  const httpUrl = getPluginInspectHttpUrl(pluginId)
  if (!httpUrl) {
    throw new Error(`Failed to start inspect for ${pluginId}`)
  }
  return httpUrl
}

async function connectSession(pluginId: string): Promise<UiSession> {
  const httpUrl = await ensureInspect(pluginId)
  const browser = await chromium.connectOverCDP(httpUrl)

  let context = browser.contexts()[0]
  for (let i = 0; i < 30 && (!context || context.pages().length === 0); i++) {
    await new Promise((r) => setTimeout(r, 100))
    context = browser.contexts()[0]
  }
  if (!context || context.pages().length === 0) {
    await browser.close().catch(() => {})
    throw new Error(`No page found for plugin: ${pluginId}`)
  }

  const outputDir = snapshotDir(pluginId)
  const backend = new BrowserBackend(
    {
      outputDir,
      imageResponses: 'allow',
      codegen: 'none',
    },
    context,
    browserTools
  )
  await backend.initialize({
    cwd: outputDir,
    clientName: 'tinker-ui',
  })

  const session: UiSession = { pluginId, browser, backend }
  browser.on('disconnected', () => {
    if (sessions.get(pluginId) === session) {
      sessions.delete(pluginId)
    }
  })
  return session
}

async function ensureSession(pluginId: string): Promise<UiSession> {
  const entry = pluginViews[pluginId]
  if (!entry || entry.view.webContents.isDestroyed()) {
    throw new Error(
      `Plugin is not running. Please start it first: tinker open ${pluginId.replace(
        /^tinker-/,
        ''
      )}`
    )
  }

  const existing = sessions.get(pluginId)
  if (existing && existing.browser.isConnected()) {
    return existing
  }

  const pending = connecting.get(pluginId)
  if (pending) {
    return pending
  }

  const promise = connectSession(pluginId)
    .then((session) => {
      sessions.set(pluginId, session)
      return session
    })
    .finally(() => {
      connecting.delete(pluginId)
    })
  connecting.set(pluginId, promise)
  return promise
}

async function tearDownSession(session: UiSession) {
  if (sessions.get(session.pluginId) === session) {
    sessions.delete(session.pluginId)
  }
  await session.backend.dispose().catch(() => {})
  await session.browser.close().catch(() => {})
}

export async function disposeUiSession(pluginId: string) {
  const pending = connecting.get(pluginId)
  connecting.delete(pluginId)
  if (pending) {
    try {
      await tearDownSession(await pending)
    } catch {
      // ignore
    }
  }

  const session = sessions.get(pluginId)
  if (session) {
    await tearDownSession(session)
  }
}

export function disposeAllUiSessions() {
  for (const pluginId of new Set([...sessions.keys(), ...connecting.keys()])) {
    void disposeUiSession(pluginId)
  }
}

function coerceValue(flag: string, raw: unknown, kind: 'boolean' | 'string') {
  if (kind === 'boolean') {
    if (raw === undefined) return true
    if (raw === false || raw === 'false' || raw === '0') return false
    return true
  }
  if (raw === undefined || raw === null) return undefined
  if (
    flag === 'depth' ||
    flag === 'context' ||
    flag === 'index' ||
    flag === 'x' ||
    flag === 'y' ||
    flag === 'w' ||
    flag === 'h' ||
    flag === 'dx' ||
    flag === 'dy'
  ) {
    const n = Number(raw)
    return Number.isFinite(n) ? n : raw
  }
  return String(raw)
}

function bindPlaywrightCliArgs(
  action: string,
  positional: string[],
  options: Record<string, unknown> = {}
): Record<string, unknown> {
  const schema = helpJson.commands[action]
  const args: Record<string, unknown> = {}

  if (schema?.args?.length) {
    const names = schema.args
    names.forEach((name, index) => {
      if (index === names.length - 1 && positional.length > names.length) {
        if (name === 'files') {
          args[name] = positional.slice(index)
          return
        }
      }
      if (positional[index] !== undefined) {
        args[name] = positional[index]
      }
    })
  }

  for (const [key, value] of Object.entries(options)) {
    if (value === undefined) continue
    const kebab = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
    const flagKind =
      schema?.flags?.[kebab] ||
      (helpJson.booleanOptions.includes(kebab) ? 'boolean' : 'string')
    args[kebab] = coerceValue(kebab, value, flagKind)
  }

  if (action === 'snapshot') {
    if (options.inline) {
      delete args.filename
    } else if (!args.filename) {
      args.filename = '<auto>'
    }
  }

  return args
}

function formatToolResult(result: {
  content: Array<{ type: string; text?: string }>
  isError?: boolean
}): string {
  const parsed = parseResponse(result)
  if (parsed.isError || result.isError) {
    throw new Error(parsed.text || 'UI command failed')
  }
  return parsed.text || 'Done.'
}

export interface UiCommandRequest {
  action: string
  args?: string[]
  options?: Record<string, unknown>
}

export async function runUiCommand(
  pluginId: string,
  req: UiCommandRequest
): Promise<string> {
  const action = req.action
  const session = await ensureSession(pluginId)
  const bound = bindPlaywrightCliArgs(action, req.args || [], req.options || {})
  const { toolName, toolParams } = resolveUiCommand(action, bound)

  const cleaned: Record<string, unknown> = {
    _meta: { cwd: snapshotDir(pluginId) },
  }
  for (const [k, v] of Object.entries(toolParams || {})) {
    if (v !== undefined) cleaned[k] = v
  }

  const result = await session.backend.callTool(toolName, cleaned)
  return formatToolResult(result)
}
