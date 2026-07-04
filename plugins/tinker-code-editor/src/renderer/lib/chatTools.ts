import type { AgentTool } from 'share/lib/Agent'
import { createToolMessageHelpers } from 'share/lib/aiChat/toolHelpers'
import {
  EDIT_FILE_TOOL,
  LIST_DIR_TOOL,
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
} from 'share/tools/fileSystem'
import { EXEC_TOOL } from 'share/tools/shell'
import { relativePath } from './path'

const LIST_OPEN_FILES_TOOL = {
  type: 'function',
  function: {
    name: 'list_open_files',
    description:
      'List file paths currently open in the editor tabs, including which tab is active and whether it has unsaved changes.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
} as const

const GET_ACTIVE_FILE_TOOL = {
  type: 'function',
  function: {
    name: 'get_active_file',
    description:
      'Get the file path of the currently focused editor tab. Use read_file to read its content from disk.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
} as const

export interface EditorTabInfo {
  filePath: string
  title: string
  isActive: boolean
  isDirty: boolean
  category: string
}

export interface EditorChatContext {
  rootPath: string
  cursorLine: number
  cursorColumn: number
  tabs: EditorTabInfo[]
}

const TOOL_DEFINITIONS = [
  EXEC_TOOL,
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  EDIT_FILE_TOOL,
  LIST_DIR_TOOL,
  LIST_OPEN_FILES_TOOL,
  GET_ACTIVE_FILE_TOOL,
] as const

function getToolName(tool: (typeof TOOL_DEFINITIONS)[number]): string {
  const definition = tool as {
    function?: { name?: string }
    name?: string
  }

  return definition.function?.name ?? definition.name ?? ''
}

const SUPPORTED_TOOL_NAMES = TOOL_DEFINITIONS.map(getToolName).filter(Boolean)

const { getVisibleToolMessages } =
  createToolMessageHelpers(SUPPORTED_TOOL_NAMES)

export { getVisibleToolMessages }

function formatTabPath(tab: EditorTabInfo, rootPath: string): string {
  if (!tab.filePath) return tab.title
  return rootPath ? relativePath(rootPath, tab.filePath) : tab.filePath
}

function listOpenEditorFiles(context: EditorChatContext): string {
  if (context.tabs.length === 0) {
    return 'No files are open in the editor.'
  }

  const lines = context.tabs.map((tab) => {
    const path = formatTabPath(tab, context.rootPath)
    const flags = [
      tab.isActive ? 'active' : '',
      tab.isDirty ? 'unsaved' : '',
      tab.category !== 'text' ? tab.category : '',
    ].filter(Boolean)
    const suffix = flags.length > 0 ? ` (${flags.join(', ')})` : ''
    return `- ${path}${suffix}`
  })

  return `Open editor tabs (${context.tabs.length}):\n${lines.join('\n')}`
}

function getActiveEditorFile(context: EditorChatContext): string {
  const tab = context.tabs.find((item) => item.isActive)
  if (!tab) {
    return 'Error: No file is focused in the editor.'
  }

  if (!tab.filePath) {
    return `Error: The focused tab "${tab.title}" has no file path (${tab.category}).`
  }

  const path = formatTabPath(tab, context.rootPath)
  const parts = [`Path: ${path}`]
  if (tab.isDirty) parts.push('unsaved changes')
  parts.push(
    `cursor: line ${context.cursorLine}, column ${context.cursorColumn}`
  )
  if (tab.category !== 'text') parts.push(`type: ${tab.category}`)
  return parts.join(' | ')
}

export function getToolArgSummary(
  name: string,
  args: Record<string, unknown>
): string {
  switch (name) {
    case 'exec': {
      const command = typeof args.command === 'string' ? args.command : ''
      return command.length > 60 ? `${command.slice(0, 60)}…` : command
    }
    case 'read_file':
    case 'write_file':
    case 'edit_file':
    case 'list_dir':
      return typeof args.path === 'string' ? String(args.path) : ''
    case 'list_open_files':
    case 'get_active_file':
      return ''
    default:
      return ''
  }
}

export function createCodeEditorAgentTools(
  getRootPath: () => string,
  getEditorContext: () => EditorChatContext
): AgentTool[] {
  return TOOL_DEFINITIONS.map((toolDef) => {
    const name = getToolName(toolDef)
    const tool: AgentTool = {
      definition: toolDef,
      execute: async (args) => {
        switch (name) {
          case 'list_open_files':
            return listOpenEditorFiles(getEditorContext())
          case 'get_active_file':
            return getActiveEditorFile(getEditorContext())
        }

        const rootPath = getRootPath()
        if (!rootPath) {
          return 'Error: No project folder is open. Ask the user to open a folder first.'
        }

        switch (name) {
          case 'exec': {
            const command = typeof args.command === 'string' ? args.command : ''
            const timeout =
              typeof args.timeout === 'number' ? args.timeout : undefined
            return codeEditor.exec(command, rootPath, timeout)
          }
          case 'read_file': {
            const filePath = typeof args.path === 'string' ? args.path : ''
            const offset =
              typeof args.offset === 'number' ? args.offset : undefined
            const limit =
              typeof args.limit === 'number' ? args.limit : undefined
            return codeEditor.readFile(filePath, rootPath, offset, limit)
          }
          case 'write_file': {
            const filePath = typeof args.path === 'string' ? args.path : ''
            const content = typeof args.content === 'string' ? args.content : ''
            return codeEditor.writeFile(filePath, content, rootPath)
          }
          case 'edit_file': {
            const filePath = typeof args.path === 'string' ? args.path : ''
            const oldText =
              typeof args.old_text === 'string' ? args.old_text : ''
            const newText =
              typeof args.new_text === 'string' ? args.new_text : ''
            const replaceAll =
              typeof args.replace_all === 'boolean' ? args.replace_all : false
            return codeEditor.editFile(
              filePath,
              oldText,
              newText,
              rootPath,
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
            return codeEditor.listDir(dirPath, rootPath, recursive, maxEntries)
          }
          default:
            return `Error: Unknown tool "${name}"`
        }
      },
    }
    return tool
  })
}
