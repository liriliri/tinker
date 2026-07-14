import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open: openJson,
    get,
    set,
    format,
    minify,
    save: saveJson,
  })
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'open':
    case 'save':
      return (args.path as string) || ''
    case 'set':
      return (args.content as string) || ''
    default:
      return ''
  }
}

function get(store: Store) {
  return {
    content: store.jsonInput,
    error: store.jsonError,
    mode: store.mode,
    lineCount: store.lineCount,
    isEmpty: store.isEmpty,
    filePath: store.currentFilePath,
    fileName: store.currentFileName,
    hasUnsavedChanges: store.hasUnsavedChanges,
  }
}

async function openJson(store: Store, args: { path: string }) {
  if (!(await fileExists(args.path))) {
    throw new Error(`JSON file not found: ${args.path}`)
  }

  const content = await tinker.readFile(args.path, 'utf-8')
  store.loadFromFile(content, args.path)
  return get(store)
}

function set(store: Store, args: { content: string }) {
  store.setJsonInput(args.content)
  return get(store)
}

function format(store: Store) {
  if (store.isEmpty) {
    throw new Error('Editor is empty.')
  }
  if (store.jsonError) {
    throw new Error(store.jsonError)
  }

  store.formatJson()
  return get(store)
}

function minify(store: Store) {
  if (store.isEmpty) {
    throw new Error('Editor is empty.')
  }
  if (store.jsonError) {
    throw new Error(store.jsonError)
  }

  store.minifyJson()
  return get(store)
}

async function saveJson(store: Store, args: { path?: string }) {
  const path = args.path ?? store.currentFilePath ?? undefined

  if (!path) {
    throw new Error('path is required when no file is open.')
  }

  const savedPath = await store.saveFile(path)
  return {
    savedPath,
    ...get(store),
  }
}
