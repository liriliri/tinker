import type { AgentTool } from 'share/lib/Agent'
import {
  SearchCard,
  ToolCard,
  getSearchCardProps,
  isSearchMessageRenderable,
  type ChatMessage,
} from 'share/components/AiChat'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import {
  EDIT_FILE_TOOL,
  LIST_DIR_TOOL,
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  getToolLabel as getFileSystemToolLabel,
  type ToolName as FileSystemToolName,
} from 'share/tools/fileSystem'
import {
  EXEC_TOOL,
  getToolLabel as getShellToolLabel,
  type ToolName as ShellToolName,
} from 'share/tools/shell'
import {
  WEB_FETCH_TOOL,
  WEB_SEARCH_TOOL,
  createWebSearchToolResult,
} from 'share/tools/web'

const TOOL_DEFINITIONS = [
  EXEC_TOOL,
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  EDIT_FILE_TOOL,
  LIST_DIR_TOOL,
  WEB_SEARCH_TOOL,
  WEB_FETCH_TOOL,
] as const

type ToolName = ShellToolName | FileSystemToolName | 'web_search' | 'web_fetch'

function getToolName(tool: (typeof TOOL_DEFINITIONS)[number]): string {
  const definition = tool as {
    function?: { name?: string }
    name?: string
  }

  return definition.function?.name ?? definition.name ?? ''
}

const SUPPORTED_TOOL_NAMES = TOOL_DEFINITIONS.map(getToolName).filter(Boolean)

export function buildAssistantTools(getWorkingDir: () => string): AgentTool[] {
  return TOOL_DEFINITIONS.map((toolDef) => {
    const name = getToolName(toolDef)
    const tool: AgentTool = {
      definition: toolDef,
      execute: async (args) => {
        const workingDir = getWorkingDir()
        switch (name) {
          case 'exec': {
            const command = typeof args.command === 'string' ? args.command : ''
            const timeout =
              typeof args.timeout === 'number' ? args.timeout : undefined
            return aiAssistant.exec(command, workingDir, timeout)
          }
          case 'read_file': {
            const filePath = typeof args.path === 'string' ? args.path : ''
            const offset =
              typeof args.offset === 'number' ? args.offset : undefined
            const limit =
              typeof args.limit === 'number' ? args.limit : undefined
            return aiAssistant.readFile(filePath, workingDir, offset, limit)
          }
          case 'write_file': {
            const filePath = typeof args.path === 'string' ? args.path : ''
            const content = typeof args.content === 'string' ? args.content : ''
            return aiAssistant.writeFile(filePath, content, workingDir)
          }
          case 'edit_file': {
            const filePath = typeof args.path === 'string' ? args.path : ''
            const oldText =
              typeof args.old_text === 'string' ? args.old_text : ''
            const newText =
              typeof args.new_text === 'string' ? args.new_text : ''
            const replaceAll =
              typeof args.replace_all === 'boolean' ? args.replace_all : false
            return aiAssistant.editFile(
              filePath,
              oldText,
              newText,
              workingDir,
              replaceAll
            )
          }
          case 'list_dir': {
            const dirPath = typeof args.path === 'string' ? args.path : '.'
            const recursive =
              typeof args.recursive === 'boolean' ? args.recursive : false
            const maxEntries =
              typeof args.max_entries === 'number'
                ? args.max_entries
                : undefined
            return aiAssistant.listDir(
              dirPath,
              workingDir,
              recursive,
              maxEntries
            )
          }
          case 'web_search': {
            const query = typeof args.query === 'string' ? args.query : ''
            const results = await aiAssistant.webSearch(query)
            return createWebSearchToolResult(results)
          }
          case 'web_fetch': {
            const url = typeof args.url === 'string' ? args.url : ''
            return aiAssistant.webFetch(url)
          }
          default:
            return `Error: Unknown tool "${name}"`
        }
      },
    }
    return tool
  })
}

export function getToolLabel(name: string): string {
  const labels: Partial<Record<ToolName, string>> = {
    web_search: 'Web Search',
    web_fetch: 'Web Fetch',
  }

  return (
    labels[name as ToolName] ??
    getShellToolLabel(name) ??
    getFileSystemToolLabel(name)
  )
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'exec':
      return typeof args.command === 'string' ? args.command : ''
    case 'read_file':
    case 'write_file':
    case 'edit_file':
    case 'list_dir':
      return typeof args.path === 'string' ? String(args.path) : ''
    case 'web_search':
      return typeof args.query === 'string' ? String(args.query) : ''
    case 'web_fetch':
      return typeof args.url === 'string' ? String(args.url) : ''
    default:
      return ''
  }
}

const { getVisibleToolMessages: getBaseVisibleToolMessages } =
  createToolMessageHelpers(SUPPORTED_TOOL_NAMES)

export function getAssistantVisibleToolMessages(
  toolMessages: ChatMessage[]
): ChatMessage[] {
  return getBaseVisibleToolMessages(toolMessages).filter((msg) => {
    if (msg.toolName === 'web_search') {
      return isSearchMessageRenderable(msg)
    }
    return true
  })
}

export function renderAssistantToolMessage(msg: ChatMessage) {
  if (msg.toolName === 'web_search') {
    return (
      <SearchCard
        {...getSearchCardProps(msg)}
        onOpenResult={(url) => aiAssistant.openExternal(url)}
      />
    )
  }

  return (
    <ToolCard
      msg={msg}
      getToolLabel={getToolLabel}
      getArgSummary={getToolArgSummary}
    />
  )
}
