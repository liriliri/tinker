import type { AgentTool } from 'share/lib/Agent'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import {
  createPluginMcpApi,
  formatMcpToolResult,
  getMcpToolsFromPackage,
  mcpToolToOpenAiDefinition,
  type PluginMcp,
} from 'share/lib/mcp'
import { getPageContext } from './lib/pageContext'
import type { Store } from './store'
import pkg from '../../package.json'

const MAX_TEXT_LENGTH = 30000

const AGENT_TOOL_NAMES = [
  'navigate',
  'get_page_info',
  'get_page_text',
  'get_page_selection',
  'get_page_metadata',
] as const

const { getVisibleToolMessages } = createToolMessageHelpers([
  ...AGENT_TOOL_NAMES,
])

export { getVisibleToolMessages }

export interface BrowserMcp extends PluginMcp {
  createAgentToolsForTab: (tabId: string) => AgentTool[]
}

export function createMcpApi(getStore: () => Store): BrowserMcp {
  const mcp = createPluginMcpApi(getStore, pkg, {
    list_tabs: listTabs,
    activate_tab: activateTab,
    create_tab: createTab,
    close_tab: closeTabTool,
    navigate,
    get_page_info: getPageInfo,
    get_page_text: getPageText,
    get_page_selection: getPageSelection,
    get_page_metadata: getPageMetadata,
  })

  const tools = getMcpToolsFromPackage(pkg)

  return {
    ...mcp,
    createAgentToolsForTab(tabId: string): AgentTool[] {
      return AGENT_TOOL_NAMES.map((name) => {
        const tool = tools[name]
        if (!tool) {
          throw new Error(`Missing MCP tool definition: ${name}`)
        }
        return {
          definition: mcpToolToOpenAiDefinition(name, tool),
          execute: async (args) =>
            formatMcpToolResult(
              await mcp.callTool(name, { ...args, tab_id: tabId })
            ),
        }
      })
    },
  }
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'navigate':
    case 'create_tab':
      return typeof args.url === 'string' ? args.url : ''
    case 'activate_tab':
    case 'close_tab':
      return typeof args.tab_id === 'string' ? args.tab_id : ''
    default:
      return typeof args.tab_id === 'string' ? args.tab_id : ''
  }
}

interface TabArgs {
  tab_id?: string
}

function resolveTabId(store: Store, tabId?: string): string {
  const id = tabId || store.activeTabId
  if (!store.tabs.some((tab) => tab.id === id)) {
    throw new Error(
      tabId
        ? `Tab "${tabId}" not found. Call list_tabs first.`
        : 'No active browser tab.'
    )
  }
  return id
}

function requirePageContext(tabId: string) {
  const context = getPageContext(tabId)
  if (!context) {
    throw new Error('Tab is not available.')
  }
  if (!context.url) {
    throw new Error('No web page is open in this tab.')
  }
  return context
}

async function runInPage(tabId: string, script: string): Promise<unknown> {
  const context = requirePageContext(tabId)
  const webview = context.getWebview()
  if (!webview) {
    throw new Error('Web page is not loaded yet.')
  }

  try {
    return await webview.executeJavaScript(script, true)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read page content. ${message}`)
  }
}

function listTabs(store: Store) {
  return {
    activeTabId: store.activeTabId,
    tabs: store.tabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      isLoading: tab.isLoading,
      active: tab.id === store.activeTabId,
    })),
  }
}

function activateTab(store: Store, args: { tab_id: string }) {
  const tabId = resolveTabId(store, args.tab_id)
  store.setActiveTab(tabId)
  return listTabs(store)
}

function createTab(store: Store, args: { url?: string } = {}) {
  const url = typeof args.url === 'string' ? args.url.trim() : ''
  store.addTab()
  if (url) {
    store.navigate(url, store.activeTabId)
  }
  return {
    tabId: store.activeTabId,
    ...listTabs(store),
  }
}

function closeTabTool(store: Store, args: TabArgs) {
  const tabId = resolveTabId(store, args.tab_id)
  if (store.tabs.length <= 1) {
    throw new Error('Cannot close the last browser tab.')
  }
  store.closeTab(tabId)
  return listTabs(store)
}

function navigate(store: Store, args: TabArgs & { url: string }) {
  const tabId = resolveTabId(store, args.tab_id)
  const url = args.url.trim()
  if (!url) {
    throw new Error('URL is empty.')
  }
  store.navigate(url, tabId)
  const tab = store.tabs.find((item) => item.id === tabId)
  return {
    tabId,
    url: tab?.url ?? url,
    title: tab?.title ?? '',
    isLoading: tab?.isLoading ?? false,
  }
}

async function getPageInfo(store: Store, args: TabArgs) {
  const tabId = resolveTabId(store, args.tab_id)
  const context = requirePageContext(tabId)

  let liveTitle = context.title
  let liveUrl = context.url

  try {
    const result = await runInPage(
      tabId,
      `(() => JSON.stringify({
        title: document.title || '',
        url: location.href || '',
      }))()`
    )
    if (typeof result === 'string') {
      const parsed = JSON.parse(result) as { title?: string; url?: string }
      if (parsed.title) liveTitle = parsed.title
      if (parsed.url) liveUrl = parsed.url
    }
  } catch {
    // Fall back to tab state when live page data is unavailable.
  }

  return {
    tabId,
    title: liveTitle,
    url: liveUrl,
    isLoading: context.isLoading,
  }
}

async function getPageText(store: Store, args: TabArgs) {
  const tabId = resolveTabId(store, args.tab_id)
  const result = await runInPage(
    tabId,
    `(() => {
      const text = document.body?.innerText?.replace(/\\s+/g, ' ').trim() || '';
      return text;
    })()`
  )

  const text = typeof result === 'string' ? result : String(result ?? '')
  if (!text) {
    return 'The page has no visible text content.'
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return `${text.slice(0, MAX_TEXT_LENGTH)}\n\n[Truncated: ${
      text.length - MAX_TEXT_LENGTH
    } more characters omitted]`
  }

  return text
}

async function getPageSelection(store: Store, args: TabArgs) {
  const tabId = resolveTabId(store, args.tab_id)
  const result = await runInPage(
    tabId,
    `(() => {
      const selection = window.getSelection?.()?.toString()?.trim() || '';
      return selection;
    })()`
  )

  const selection = typeof result === 'string' ? result : String(result ?? '')
  if (!selection) {
    return 'No text is selected on the page.'
  }
  return selection
}

async function getPageMetadata(store: Store, args: TabArgs) {
  const tabId = resolveTabId(store, args.tab_id)
  const result = await runInPage(
    tabId,
    `(() => {
      const meta = {};
      document.querySelectorAll('meta[name], meta[property]').forEach((el) => {
        const key = el.getAttribute('name') || el.getAttribute('property');
        const content = el.getAttribute('content');
        if (key && content) meta[key] = content;
      });
      return meta;
    })()`
  )

  if (
    !result ||
    (typeof result === 'object' &&
      !Array.isArray(result) &&
      Object.keys(result as Record<string, unknown>).length === 0)
  ) {
    return 'No page metadata was found.'
  }

  return result
}
