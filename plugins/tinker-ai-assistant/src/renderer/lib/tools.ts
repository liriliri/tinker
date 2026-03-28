// Tool definitions for the AI assistant agent loop

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
import { WEB_FETCH_TOOL, WEB_SEARCH_TOOL } from 'share/tools/web'

export const TOOLS = [
  EXEC_TOOL,
  READ_FILE_TOOL,
  WRITE_FILE_TOOL,
  EDIT_FILE_TOOL,
  LIST_DIR_TOOL,
  WEB_SEARCH_TOOL,
  WEB_FETCH_TOOL,
] as const

type ToolName = ShellToolName | FileSystemToolName | 'web_search' | 'web_fetch'

function getToolName(tool: (typeof TOOLS)[number]): string {
  const definition = tool as {
    function?: { name?: string }
    name?: string
  }

  return definition.function?.name ?? definition.name ?? ''
}

const SUPPORTED_TOOL_NAMES = new Set(TOOLS.map(getToolName).filter(Boolean))

export function isSupportedToolName(name: string | undefined): boolean {
  return !!name && SUPPORTED_TOOL_NAMES.has(name)
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
