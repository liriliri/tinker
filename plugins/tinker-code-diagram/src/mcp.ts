import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
import sleep from 'licia/sleep'
import {
  getDiagramBackground,
  getSvgElement,
  writeDiagramFile,
} from './lib/mermaid'
import type { Store } from './store'
import pkg from '../package.json'

export function createMcpApi(getStore: () => Store): PluginMcp {
  return createPluginMcpApi(getStore, pkg, {
    get,
    set,
    export: exportDiagram,
  })
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'set':
      return (args.content as string) || ''
    case 'export':
      return (args.path as string) || ''
    default:
      return ''
  }
}

function get(store: Store) {
  return {
    content: store.codeInput,
    viewMode: store.viewMode,
    darkMode: store.darkMode,
    lineCount: store.lineCount,
    isEmpty: store.isEmpty,
    renderError: store.renderError,
  }
}

function set(store: Store, args: Record<string, unknown>) {
  store.setCodeInput(args.content as string)
  return get(store)
}

async function exportDiagram(store: Store, args: Record<string, unknown>) {
  if (store.isEmpty) {
    throw new Error('Editor is empty.')
  }

  if (store.viewMode === 'editor') {
    store.setViewMode('split')
  }

  const format = args.format as 'svg' | 'png'
  const path = args.path as string
  const darkMode = (args.darkMode as boolean | undefined) ?? store.darkMode
  const themeChanged = darkMode !== store.darkMode

  if (themeChanged) {
    store.setDarkMode(darkMode)
  }

  const svg = await waitForSvg(store, themeChanged)

  await writeDiagramFile(
    svg,
    format,
    path,
    getDiagramBackground(store.darkMode)
  )

  return {
    path,
    format,
    ...get(store),
  }
}

async function waitForSvg(
  store: Store,
  awaitRerender = false
): Promise<SVGSVGElement> {
  const deadline = Date.now() + 10000

  if (awaitRerender) {
    const renderStartedBy = Date.now() + 500
    while (!store.loading && Date.now() < renderStartedBy) {
      await sleep(50)
    }
  }

  while (Date.now() < deadline) {
    if (store.renderError) {
      throw new Error(store.renderError)
    }
    if (!store.loading) {
      const svg = getSvgElement(document.getElementById('diagram-preview'))
      if (svg) return svg
    }
    await sleep(50)
  }
  throw new Error('No diagram to export. Fix syntax errors first.')
}
