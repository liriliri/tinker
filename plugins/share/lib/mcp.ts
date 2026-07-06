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

export type McpToolCallResult = string | Promise<string>

export interface PluginMcpBridge {
  callTool: (name: string, args: Record<string, unknown>) => McpToolCallResult
}

export interface PluginMcp extends PluginMcpBridge {
  createAgentTools: () => AgentTool[]
}

export function registerPluginMcp(api: PluginMcp): PluginMcp {
  window.mcp = { callTool: api.callTool }
  return api
}

declare global {
  interface Window {
    mcp: PluginMcpBridge
  }
}
