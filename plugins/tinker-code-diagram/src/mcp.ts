import { createPluginMcpApi, type PluginMcp } from 'share/lib/mcp'
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
  const svg = await waitForSvg(store)

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

async function waitForSvg(store: Store): Promise<SVGSVGElement> {
  const deadline = Date.now() + 10000
  while (Date.now() < deadline) {
    if (store.renderError) {
      throw new Error(store.renderError)
    }
    const svg = getSvgElement(document.getElementById('diagram-preview'))
    if (svg) return svg
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('No diagram to export. Fix syntax errors first.')
}
