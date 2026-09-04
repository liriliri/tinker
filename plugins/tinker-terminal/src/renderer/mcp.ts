import type { AgentTool } from 'share/lib/Agent'
import {
  getTerminalSession,
  getTerminalSelection,
} from 'share/components/Terminal'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import {
  createPluginMcpApi,
  formatMcpToolResult,
  getMcpToolsFromPackage,
  mcpToolToOpenAiDefinition,
  type PluginMcp,
} from 'share/lib/mcp'
import { getTabPaneContext } from './lib/tabContext'
import type { Store } from './store'
import pkg from '../../package.json'

const AGENT_TOOL_NAMES = [
  'get_terminal_info',
  'get_selection',
  'run_command',
  'write_to_terminal',
] as const

const { getVisibleToolMessages } = createToolMessageHelpers([
  ...AGENT_TOOL_NAMES,
])

export { getVisibleToolMessages }

export interface TerminalMcp extends PluginMcp {
  createAgentToolsForTab: (tabId: string) => AgentTool[]
}

export function createMcpApi(getStore: () => Store): TerminalMcp {
  const mcp = createPluginMcpApi(getStore, pkg, {
    list_tabs: listTabs,
    activate_tab: activateTab,
    create_tab: createTab,
    close_tab: closeTabTool,
    get_terminal_info: getTerminalInfo,
    get_selection: getSelection,
    run_command: runCommand,
    write_to_terminal: writeToTerminal,
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
    case 'run_command':
      return typeof args.command === 'string' ? args.command : ''
    case 'write_to_terminal':
      return typeof args.text === 'string' ? args.text : ''
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
        : 'No active terminal tab.'
    )
  }
  return id
}

function resolveSession(store: Store, tabId?: string) {
  const id = resolveTabId(store, tabId)
  const context = getTabPaneContext(id)
  if (!context) {
    throw new Error('Tab is not available.')
  }

  const session = getTerminalSession(context.paneId)
  if (!session) {
    throw new Error('Terminal pane is not ready.')
  }

  return { tabId: id, context, session }
}

function listTabs(store: Store) {
  return {
    activeTabId: store.activeTabId,
    tabs: store.tabs.map((tab) => ({
      id: tab.id,
      title: tab.title,
      active: tab.id === store.activeTabId,
      activePaneId: tab.activePaneId,
    })),
  }
}

function activateTab(store: Store, args: { tab_id: string }) {
  const tabId = resolveTabId(store, args.tab_id)
  store.setActiveTab(tabId)
  return listTabs(store)
}

function createTab(store: Store) {
  store.addTab()
  return {
    tabId: store.activeTabId,
    ...listTabs(store),
  }
}

function closeTabTool(store: Store, args: TabArgs) {
  const tabId = resolveTabId(store, args.tab_id)
  if (store.tabs.length <= 1) {
    throw new Error('Cannot close the last terminal tab.')
  }
  store.closeTab(tabId)
  return listTabs(store)
}

async function getTerminalInfo(store: Store, args: TabArgs) {
  const { tabId, context, session } = resolveSession(store, args.tab_id)
  const info = await session.getInfo()
  return {
    tabId,
    tabTitle: context.tabTitle,
    paneTitle: context.paneTitle,
    cwd: info.cwd,
    processName: info.processName,
  }
}

function getSelection(store: Store, args: TabArgs) {
  const { context } = resolveSession(store, args.tab_id)
  const selection = getTerminalSelection(context.paneId)
  if (!selection) {
    return 'No text is selected in the terminal.'
  }
  return selection
}

function runCommand(store: Store, args: TabArgs & { command: string }) {
  const { tabId, session } = resolveSession(store, args.tab_id)
  const command = args.command.trim()
  if (!command) {
    throw new Error('Command is empty.')
  }

  session.write(`${command}\r`)
  return { tabId, command, message: `Command sent to terminal: ${command}` }
}

function writeToTerminal(store: Store, args: TabArgs & { text: string }) {
  const { tabId, session } = resolveSession(store, args.tab_id)
  if (!args.text) {
    throw new Error('Text is empty.')
  }

  session.write(args.text)
  return {
    tabId,
    length: args.text.length,
    message: `Sent ${args.text.length} characters to terminal.`,
  }
}
