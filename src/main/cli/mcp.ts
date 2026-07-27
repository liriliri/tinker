import { Command } from 'commander'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import { sendCommand } from './ipc'
import { normalizePluginId } from './util'
import type { IPlugin, IMcpToolDefinition } from 'common/types'

type ExecuteCommand = (
  command: string,
  data?: Record<string, unknown>,
  options?: { format?: (data: unknown) => void }
) => void

const ajv = new Ajv({ allErrors: true })
const validatorCache = new Map<string, ValidateFunction>()

export function validateMcpToolArgs(
  cacheKey: string,
  schema: Record<string, unknown> | undefined,
  args: Record<string, unknown>
): string | null {
  if (!schema) return null

  let validate = validatorCache.get(cacheKey)
  if (!validate) {
    validate = ajv.compile(schema)
    validatorCache.set(cacheKey, validate)
  }

  if (validate(args)) return null
  return formatAjvErrors(validate.errors ?? [])
}

function formatAjvErrors(errors: ErrorObject[]): string {
  const parts = errors.map((err) => {
    if (err.keyword === 'required') {
      return `"${String(err.params.missingProperty)}" is required`
    }
    const field = err.instancePath.slice(1) || 'arguments'
    const message = err.message ?? 'is invalid'
    return `${field} ${message}`
  })
  return `Invalid arguments: ${parts.join('; ')}`
}

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

function formatToolResult(text: string): { text: string; isError: boolean } {
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
      const { text, isError } = formatToolResult(res.data as string)
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

function formatPluginTools(data: unknown) {
  const plugin = data as IPlugin
  if (!plugin.mcp) {
    throw new Error(`${plugin.name} does not support MCP.`)
  }
  console.log(JSON.stringify(plugin.mcp.tools, null, 2))
}

function formatToolCallResult(data: unknown) {
  if (typeof data === 'string') {
    console.log(data)
    return
  }
  console.log(JSON.stringify(data, null, 2))
}

export function registerMcpCommands(
  program: Command,
  executeCommand: ExecuteCommand
) {
  program
    .command('tools <plugin>')
    .description('List MCP tools for a plugin')
    .action((pluginName: string) => {
      executeCommand(
        'getPlugin',
        { id: normalizePluginId(pluginName) },
        {
          format: formatPluginTools,
        }
      )
    })

  program
    .command('call <plugin>')
    .description('Call an MCP tool on a running plugin')
    .requiredOption('--tool <name>', 'Tool name to call')
    .option('--args <json>', 'Tool arguments as JSON', '{}')
    .action((pluginName: string, opts: { tool: string; args: string }) => {
      let args: Record<string, unknown>
      try {
        args = JSON.parse(opts.args)
      } catch {
        console.error('Error: Invalid JSON for --args')
        process.exit(1)
      }
      if (args === null || typeof args !== 'object' || Array.isArray(args)) {
        console.error('Error: --args must be a JSON object')
        process.exit(1)
      }
      executeCommand(
        'callMcpTool',
        {
          id: normalizePluginId(pluginName),
          name: opts.tool,
          args,
        },
        { format: formatToolCallResult }
      )
    })

  program
    .command('mcp <plugin>')
    .description('Start an MCP server for a plugin (stdio transport)')
    .action(async (pluginName: string) => {
      try {
        await startMcpServer(normalizePluginId(pluginName))
      } catch (err: any) {
        console.error(`Error: ${err.message || 'Failed to start MCP server'}`)
        process.exit(1)
      }
    })
}
