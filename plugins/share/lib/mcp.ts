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

export type McpToolHandlerFn<TStore, TArgs = any> = (
  store: TStore,
  args: TArgs
) => any

export type McpToolHandlers<TStore> = Record<string, McpToolHandlerFn<TStore>>

function dispatchMcpTool<TStore>(
  handlers: McpToolHandlers<TStore>,
  store: TStore,
  name: string,
  args: Record<string, unknown>
) {
  const handler = handlers[name]
  if (!handler) {
    throw new Error(`Unknown tool "${name}"`)
  }
  return handler(store, args)
}

export function formatMcpToolResult(result: unknown): string {
  if (typeof result === 'string') return result
  return JSON.stringify(result, null, 2)
}

export interface PluginMcpHandlers {
  callTool: (name: string, args: Record<string, unknown>) => any
  createAgentTools: () => Array<{
    definition: object
    execute: (args: Record<string, unknown>) => any
  }>
}

export interface PluginMcp {
  callTool: (name: string, args: Record<string, unknown>) => any
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
  tinker.registerMcp({ callTool: api.callTool })

  return {
    callTool: api.callTool,
    createAgentTools: () =>
      api.createAgentTools().map((tool) => ({
        definition: tool.definition,
        execute: async (args) => formatMcpToolResult(await tool.execute(args)),
      })),
  }
}
