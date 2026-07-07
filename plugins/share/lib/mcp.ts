import type { AgentTool } from './Agent'

export interface McpToolDefinition {
  description: string
  inputSchema?: Record<string, unknown>
}

export interface OpenAiFunctionToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters?: Record<string, unknown>
  }
}

export interface TinkerMcpPackage {
  tinker?: {
    mcp?: {
      tools?: Record<string, McpToolDefinition>
    }
  }
}

export function getMcpToolsFromPackage(
  pkg: TinkerMcpPackage
): Record<string, McpToolDefinition> {
  return pkg.tinker?.mcp?.tools ?? {}
}

export function mcpToolToOpenAiDefinition(
  name: string,
  tool: McpToolDefinition
): OpenAiFunctionToolDefinition {
  const definition: OpenAiFunctionToolDefinition = {
    type: 'function',
    function: {
      name,
      description: tool.description,
    },
  }

  if (tool.inputSchema) {
    definition.function.parameters = tool.inputSchema
  }

  return definition
}

export function mcpToolsToOpenAiDefinitions(
  tools: Record<string, McpToolDefinition>
): OpenAiFunctionToolDefinition[] {
  return Object.entries(tools).map(([name, tool]) =>
    mcpToolToOpenAiDefinition(name, tool)
  )
}

export type McpJsonValue =
  | null
  | boolean
  | number
  | string
  | McpJsonValue[]
  | { [key: string]: McpJsonValue }

export type McpToolHandlerReturn = unknown | Promise<unknown>

export type McpToolHandlerFn<TStore> = (
  store: TStore,
  args: Record<string, unknown>
) => McpToolHandlerReturn

export type McpToolHandlers<TStore> = Record<string, McpToolHandlerFn<TStore>>

export type McpToolCallResult = string | Promise<string>

function dispatchMcpTool<TStore>(
  handlers: McpToolHandlers<TStore>,
  store: TStore,
  name: string,
  args: Record<string, unknown>
): McpToolHandlerReturn {
  const handler = handlers[name]
  if (!handler) {
    return `Error: Unknown tool "${name}"`
  }
  return handler(store, args)
}

export function formatMcpToolResult(result: unknown): string {
  if (typeof result === 'string') return result
  return JSON.stringify(result, null, 2)
}

export function formatMcpError(error: unknown, fallback: string): string {
  return `Error: ${error instanceof Error ? error.message : fallback}`
}

export function truncateMcpArg(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

export interface PluginMcpHandlers {
  callTool: (
    name: string,
    args: Record<string, unknown>
  ) => McpToolHandlerReturn
  createAgentTools: () => Array<{
    definition: object
    execute: (args: Record<string, unknown>) => McpToolHandlerReturn
  }>
}

export interface PluginMcpBridge {
  callTool: (name: string, args: Record<string, unknown>) => McpToolCallResult
}

export interface PluginMcp extends PluginMcpBridge {
  createAgentTools: () => AgentTool[]
}

export function createPluginMcpApi<TStore>(
  getStore: () => TStore,
  pkg: TinkerMcpPackage,
  handlers: McpToolHandlers<TStore>
): PluginMcp {
  const toolDefinitions = mcpToolsToOpenAiDefinitions(
    getMcpToolsFromPackage(pkg)
  )

  const executeTool = (
    store: TStore,
    name: string,
    args: Record<string, unknown>
  ) => dispatchMcpTool(handlers, store, name, args)

  return registerPluginMcp({
    callTool: (name, args) => executeTool(getStore(), name, args),
    createAgentTools: () =>
      toolDefinitions.map((definition) => ({
        definition,
        execute: (args) =>
          executeTool(getStore(), definition.function.name, args),
      })),
  })
}

export function registerPluginMcp(api: PluginMcpHandlers): PluginMcp {
  const callTool = (
    name: string,
    args: Record<string, unknown>
  ): McpToolCallResult => {
    const result = api.callTool(name, args)
    if (result instanceof Promise) {
      return result.then(formatMcpToolResult)
    }
    return formatMcpToolResult(result)
  }

  window.mcp = { callTool }

  return {
    callTool,
    createAgentTools: () =>
      api.createAgentTools().map((tool) => ({
        definition: tool.definition,
        execute: async (args) => {
          const result = await Promise.resolve(tool.execute(args))
          return formatMcpToolResult(result)
        },
      })),
  }
}

declare global {
  interface Window {
    mcp: PluginMcpBridge
  }
}
