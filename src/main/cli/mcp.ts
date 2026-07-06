import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import { sendCommand } from './ipc'
import type { IPlugin, IMcpToolDefinition } from 'common/types'

export function toListTools(tools: Record<string, IMcpToolDefinition>) {
  return Object.entries(tools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: tool.inputSchema ?? { type: 'object', properties: {} },
  }))
}

interface PluginMcpInfo {
  id: string
  name: string
  version: string
  tools: Record<string, IMcpToolDefinition>
}

function formatToolResult(data: unknown): { text: string; isError: boolean } {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  return { text, isError: text.startsWith('Error:') }
}

async function fetchMcpInfo(id: string): Promise<PluginMcpInfo> {
  const res = await sendCommand('getPlugin', { id })
  if (!res.success) {
    throw new Error(res.error || 'Failed to get plugin')
  }
  const plugin = res.data as IPlugin
  if (!plugin.mcp) {
    throw new Error(`${plugin.name} does not support MCP.`)
  }
  return {
    id: plugin.id,
    name: plugin.name,
    version: plugin.version || '0.0.0',
    tools: plugin.mcp.tools,
  }
}

export async function startMcpServer(id: string): Promise<void> {
  let info: PluginMcpInfo
  try {
    info = await fetchMcpInfo(id)
  } catch (err: any) {
    const message = err.message || String(err)
    console.error(
      message.includes('connect') || message.includes('ECONNREFUSED')
        ? 'Error: Tinker is not running. Please start Tinker first.'
        : `Error: ${message}`
    )
    process.exit(1)
  }

  const { tools } = info

  const server = new Server(
    { name: info.id, version: info.version },
    { capabilities: { tools: {} } }
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toListTools(tools),
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params

    if (!tools[name]) {
      return {
        content: [{ type: 'text', text: `Error: Unknown tool "${name}"` }],
        isError: true,
      }
    }

    try {
      const res = await sendCommand('callMcpTool', { id: info.id, name, args })
      if (!res.success) {
        return {
          content: [{ type: 'text', text: res.error || 'Unknown error' }],
          isError: true,
        }
      }
      const { text, isError } = formatToolResult(res.data)
      return {
        content: [{ type: 'text', text }],
        isError,
      }
    } catch (err: any) {
      const message = err.message || String(err)
      const text = message.includes('connect')
        ? 'Error: Tinker is not running. Please start Tinker first.'
        : `Error: ${message}`
      return {
        content: [{ type: 'text', text }],
        isError: true,
      }
    }
  })

  const transport = new StdioServerTransport()
  await server.connect(transport)
}
