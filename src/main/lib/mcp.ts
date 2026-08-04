import { app } from 'electron'
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import {
  StdioClientTransport,
  getDefaultEnvironment,
  type StdioServerParameters,
} from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { McpServerConfig } from 'common/types'
import once from 'licia/once'

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

interface CachedClient {
  client: Client
  transport: Transport
}

const clients = new Map<string, CachedClient>()
const connecting = new Map<string, Promise<CachedClient>>()

function configKey(config: McpServerConfig): string {
  return JSON.stringify(normalizeConfig(config))
}

function normalizeConfig(config: McpServerConfig): Record<string, unknown> {
  if (isStdioConfig(config)) {
    return {
      type: 'stdio',
      command: config.command,
      args: config.args ?? [],
      env: config.env ?? {},
      cwd: config.cwd ?? '',
    }
  }
  return {
    type: config.type,
    url: config.url,
    headers: config.headers ?? {},
  }
}

function isStdioConfig(
  config: McpServerConfig
): config is Extract<McpServerConfig, { command: string }> {
  return (
    (config as { command?: string }).command !== undefined &&
    (config.type === undefined || config.type === 'stdio')
  )
}

function createTransport(config: McpServerConfig): Transport {
  if (isStdioConfig(config)) {
    const params: StdioServerParameters = {
      command: config.command,
      args: config.args,
      cwd: config.cwd,
      stderr: 'pipe',
    }
    if (config.env) {
      params.env = { ...getDefaultEnvironment(), ...config.env }
    }
    return new StdioClientTransport(params)
  }

  const url = new URL(config.url)
  const requestInit = config.headers ? { headers: config.headers } : undefined

  if (config.type === 'sse') {
    return new SSEClientTransport(url, { requestInit })
  }

  return new StreamableHTTPClientTransport(url, { requestInit })
}

async function connect(config: McpServerConfig): Promise<CachedClient> {
  const transport = createTransport(config)
  const client = new Client({ name: 'tinker', version: '1.0.0' })
  await client.connect(transport)
  return { client, transport }
}

async function getOrConnect(config: McpServerConfig): Promise<CachedClient> {
  const key = configKey(config)
  const cached = clients.get(key)
  if (cached) return cached

  let pending = connecting.get(key)
  if (!pending) {
    pending = connect(config)
      .then((entry) => {
        clients.set(key, entry)
        connecting.delete(key)
        entry.transport.onclose = () => {
          if (clients.get(key) === entry) {
            clients.delete(key)
          }
        }
        return entry
      })
      .catch((err) => {
        connecting.delete(key)
        throw err
      })
    connecting.set(key, pending)
  }
  return pending
}

async function invalidate(config: McpServerConfig) {
  const key = configKey(config)
  const entry = clients.get(key)
  if (!entry) return
  clients.delete(key)
  try {
    await entry.client.close()
  } catch {
    // ignore close errors
  }
}

function formatToolResult(result: {
  content?: Array<{ type: string; text?: string }>
  isError?: boolean
}): string {
  const parts = (result.content ?? [])
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text as string)
  const text = parts.join('\n') || JSON.stringify(result, null, 2)
  if (result.isError) {
    return text.startsWith('Error:') ? text : `Error: ${text}`
  }
  return text
}

function isConnectionError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err)
  return /ECONNREFUSED|EPIPE|ECONNRESET|not connected|Connection closed|closed|transport/i.test(
    message
  )
}

export async function callExternalMcpTool(
  config: McpServerConfig,
  name: string,
  args: Record<string, unknown> = {}
): Promise<string> {
  if (!name) {
    throw new Error('Missing tool name')
  }
  if (isStdioConfig(config)) {
    if (!config.command) {
      throw new Error('Missing MCP server command')
    }
  } else if (!config.url) {
    throw new Error('Missing MCP server url')
  }

  const call = async () => {
    const { client } = await getOrConnect(config)
    const result = await client.callTool({ name, arguments: args })
    return formatToolResult(result as Parameters<typeof formatToolResult>[0])
  }

  try {
    return await call()
  } catch (err) {
    if (!isConnectionError(err)) {
      throw err
    }
    await invalidate(config)
    return call()
  }
}

async function closeAll() {
  const entries = [...clients.values()]
  clients.clear()
  connecting.clear()
  await Promise.all(
    entries.map(async ({ client }) => {
      try {
        await client.close()
      } catch {
        // ignore
      }
    })
  )
}

export const init = once(() => {
  app.on('will-quit', () => {
    void closeAll()
  })
})
