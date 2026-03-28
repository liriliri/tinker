import uuid from 'licia/uuid'
import jsonClone from 'licia/jsonClone'
import type { WebSearchResult } from '../tools/web'

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export type ToolStatus = 'running' | 'done' | 'error'

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant' | 'tool'
  content: string
  generating?: boolean
  error?: string
  toolCalls?: ToolCall[]
  toolCallId?: string
  toolName?: string
  toolArgs?: Record<string, unknown>
  toolStatus?: ToolStatus
  searchResults?: WebSearchResult[]
}

export type AgentToolResult =
  | string
  | ({ content: string } & Partial<AgentMessage>)

export interface AgentTool {
  definition: object
  execute: (
    args: Record<string, unknown>
  ) => Promise<AgentToolResult> | AgentToolResult
}

export interface AgentOptions {
  provider?: string
  model?: string
  systemPrompt?: string
  tools?: AgentTool[]
  maxIterations?: number
  onMessage: (msg: AgentMessage) => void
  onMessageUpdate: (id: string, patch: Partial<AgentMessage>) => void
  getMessages: () => AgentMessage[]
}

function getToolName(tool: AgentTool): string {
  const def = tool.definition as {
    function?: { name?: string }
    name?: string
  }
  return def.function?.name ?? def.name ?? ''
}

function buildToolMap(tools: AgentTool[]): Map<string, AgentTool> {
  return new Map(tools.map((t) => [getToolName(t), t]))
}

function accumulateToolCalls(
  existing: ToolCall[],
  chunkToolCalls: Record<string, unknown>[]
): ToolCall[] {
  const result: ToolCall[] = existing.map((tc) => ({
    ...tc,
    function: { ...tc.function },
  }))

  for (const chunk of chunkToolCalls) {
    const idx = typeof chunk.index === 'number' ? chunk.index : 0
    if (!result[idx]) {
      result[idx] = {
        id:
          typeof chunk.id === 'string' ? chunk.id : `call_${idx}_${Date.now()}`,
        type: 'function',
        function: { name: '', arguments: '' },
      }
    }
    if (typeof chunk.id === 'string') result[idx].id = chunk.id
    const fn = chunk.function as Record<string, unknown> | undefined
    if (typeof fn?.name === 'string') result[idx].function.name += fn.name
    if (typeof fn?.arguments === 'string')
      result[idx].function.arguments += fn.arguments
  }

  return result.filter(Boolean)
}

export class Agent {
  private provider: string
  private model: string
  private systemPrompt: string
  private tools: AgentTool[]
  private toolMap: Map<string, AgentTool>
  private maxIterations: number
  private onMessage: (msg: AgentMessage) => void
  private onMessageUpdate: (id: string, patch: Partial<AgentMessage>) => void
  private getMessages: () => AgentMessage[]

  private streamTask: tinker.AiStreamTask | null = null
  private aborted: boolean = false
  isGenerating: boolean = false

  constructor(options: AgentOptions) {
    this.provider = options.provider ?? ''
    this.model = options.model ?? ''
    this.systemPrompt = options.systemPrompt ?? ''
    this.tools = options.tools ?? []
    this.toolMap = buildToolMap(this.tools)
    this.maxIterations = options.maxIterations ?? 20
    this.onMessage = options.onMessage
    this.onMessageUpdate = options.onMessageUpdate
    this.getMessages = options.getMessages
  }

  setProvider(provider: string) {
    this.provider = provider
  }

  setModel(model: string) {
    this.model = model
  }

  setSystemPrompt(systemPrompt: string) {
    this.systemPrompt = systemPrompt
  }

  setTools(tools: AgentTool[]) {
    this.tools = tools
    this.toolMap = buildToolMap(tools)
  }

  async send(userText: string): Promise<void> {
    const userMsg: AgentMessage = {
      id: uuid(),
      role: 'user',
      content: userText,
    }
    this.onMessage(userMsg)

    const assistantMsg: AgentMessage = {
      id: uuid(),
      role: 'assistant',
      content: '',
      generating: true,
    }
    this.onMessage(assistantMsg)
    this.isGenerating = true
    this.aborted = false

    await this.runAILoop(assistantMsg.id)
  }

  abort() {
    this.aborted = true
    if (this.streamTask) {
      this.streamTask.abort()
      this.streamTask = null
    }
    const messages = this.getMessages()
    for (const m of messages) {
      if (m.generating) {
        const patch: Partial<AgentMessage> = { generating: false }
        if (m.toolStatus === 'running') patch.toolStatus = 'error'
        this.onMessageUpdate(m.id, patch)
      }
    }
    this.isGenerating = false
  }

  private buildHistory(excludeMsgId: string): tinker.AiMessage[] {
    const history: tinker.AiMessage[] = []

    if (this.systemPrompt.trim()) {
      history.push({ role: 'system', content: this.systemPrompt.trim() })
    }

    for (const m of this.getMessages()) {
      if (m.id === excludeMsgId) continue
      if (m.generating) continue

      if (m.role === 'user') {
        history.push({ role: 'user', content: m.content })
      } else if (m.role === 'assistant') {
        if (m.toolCalls && m.toolCalls.length > 0) {
          history.push({
            role: 'assistant',
            content: m.content || undefined,
            toolCalls: m.toolCalls,
          })
        } else if (m.content) {
          history.push({ role: 'assistant', content: m.content })
        }
      } else if (m.role === 'tool' && m.toolCallId) {
        history.push({
          role: 'tool',
          toolCallId: m.toolCallId,
          toolName: m.toolName,
          content: m.content,
        })
      }
    }

    return history
  }

  private async runAILoop(initialAssistantMsgId: string): Promise<void> {
    let assistantMsgId = initialAssistantMsgId

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      if (this.aborted) {
        this.onMessageUpdate(assistantMsgId, { generating: false })
        break
      }

      const history = this.buildHistory(assistantMsgId)
      let fullContent = ''
      let accToolCalls: ToolCall[] = []
      let done = false

      await new Promise<void>((resolve) => {
        this.streamTask = tinker.callAIStream(
          jsonClone({
            provider: this.provider,
            model: this.model,
            messages: history,
            tools: this.tools.map((t) => t.definition),
          }),
          (chunk) => {
            if (this.aborted) {
              resolve()
              return
            }

            if (chunk.error) {
              this.onMessageUpdate(assistantMsgId, {
                generating: false,
                error: chunk.error,
              })
              this.isGenerating = false
              this.streamTask = null
              resolve()
              return
            }

            if (chunk.content) {
              fullContent += chunk.content
              this.onMessageUpdate(assistantMsgId, { content: fullContent })
            }

            if (chunk.toolCalls && chunk.toolCalls.length > 0) {
              accToolCalls = accumulateToolCalls(
                accToolCalls,
                chunk.toolCalls as Record<string, unknown>[]
              )
            }

            if (chunk.done) {
              done = true
              this.onMessageUpdate(assistantMsgId, { generating: false })
              this.streamTask = null
              resolve()
            }
          }
        )
      })

      if (!done || this.aborted) {
        break
      }

      if (accToolCalls.length === 0) {
        break
      }

      this.onMessageUpdate(assistantMsgId, { toolCalls: accToolCalls })

      for (const toolCall of accToolCalls) {
        if (this.aborted) break
        await this.executeToolCall(toolCall)
      }

      if (this.aborted) break

      const nextAssistantMsg: AgentMessage = {
        id: uuid(),
        role: 'assistant',
        content: '',
        generating: true,
      }
      this.onMessage(nextAssistantMsg)
      assistantMsgId = nextAssistantMsg.id
    }

    this.isGenerating = false
  }

  private async executeToolCall(toolCall: ToolCall): Promise<void> {
    const toolName = toolCall.function.name
    let args: Record<string, unknown> = {}
    try {
      args = JSON.parse(toolCall.function.arguments)
    } catch {
      // ignore parse error
    }

    const tool = this.toolMap.get(toolName)

    const toolMsg: AgentMessage = {
      id: uuid(),
      role: 'tool',
      content: '',
      toolCallId: toolCall.id,
      toolName,
      toolArgs: args,
      toolStatus: 'running',
      generating: true,
    }
    this.onMessage(toolMsg)

    if (!tool) {
      this.onMessageUpdate(toolMsg.id, {
        content: `Error: Unknown tool "${toolName}"`,
        generating: false,
        toolStatus: 'error',
      })
      return
    }

    let isError = false
    let result: AgentToolResult = ''
    try {
      result = await tool.execute(args)
    } catch (e) {
      result = `Error: ${e instanceof Error ? e.message : String(e)}`
      isError = true
    }

    const content = typeof result === 'string' ? result : result.content
    const extraPatch = typeof result === 'string' ? {} : result
    this.onMessageUpdate(toolMsg.id, {
      ...extraPatch,
      content,
      generating: false,
      toolStatus: isError ? 'error' : 'done',
    })
  }
}
