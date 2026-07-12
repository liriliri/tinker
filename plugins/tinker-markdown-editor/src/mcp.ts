import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import { fileExists } from 'share/lib/util'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    open: openMarkdown,
    get,
    set,
    save: saveMarkdown,
  })
}

function get(store: Store) {
  return {
    content: store.markdownInput,
    viewMode: store.viewMode,
    lineCount: store.lineCount,
    isEmpty: store.isEmpty,
    filePath: store.currentFilePath,
    fileName: store.currentFileName,
    hasUnsavedChanges: store.hasUnsavedChanges,
  }
}

async function openMarkdown(store: Store, args: Record<string, unknown>) {
  const path = args.path as string

  if (!(await fileExists(path))) {
    throw new Error(`Markdown file not found: ${path}`)
  }

  const content = await tinker.readFile(path, 'utf-8')
  store.loadFromFile(content, path)
  return get(store)
}

function set(store: Store, args: Record<string, unknown>) {
  store.setMarkdownInput(args.content as string)
  return get(store)
}

async function saveMarkdown(store: Store, args: Record<string, unknown>) {
  const path =
    (args.path as string | undefined) ?? store.currentFilePath ?? undefined

  if (!path) {
    throw new Error('path is required when no file is open.')
  }

  const savedPath = await store.saveFile(path)
  return {
    savedPath,
    ...get(store),
  }
}
