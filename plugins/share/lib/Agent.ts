import { makeAutoObservable } from 'mobx'
import uuid from 'licia/uuid'
import jsonClone from 'licia/jsonClone'

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
  data?: unknown
}

export type AgentToolResult =
  | string
  | {
      content: string
      data?: unknown
    }

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
  initialMessages?: AgentMessage[]
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

function cloneMessages(messages: AgentMessage[]): AgentMessage[] {
  return jsonClone(messages) as AgentMessage[]
}

function formatUnknownToolError(
  toolName: string,
  toolMap: Map<string, AgentTool>
): string {
  const availableTools = Array.from(toolMap.keys()).filter(Boolean)
  const availableText = availableTools.length
    ? availableTools.join(', ')
    : '(none)'

  return `Error: Tool '${toolName}' not found. Available: ${availableText}\n\n[Analyze the error above and try a different approach.]`
}

export class Agent {
  provider: string
  model: string
  systemPrompt: string
  tools: AgentTool[]
  maxIterations: number
  messages: AgentMessage[] = []

  private toolMap: Map<string, AgentTool>
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
    this.messages = cloneMessages(options.initialMessages ?? [])

    makeAutoObservable(this)
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

  setMessages(messages: AgentMessage[]) {
    this.messages = cloneMessages(messages)
  }

  getMessages(): AgentMessage[] {
    return this.messages
  }

  clearMessages() {
    this.messages = []
  }

  deleteMessage(id: string) {
    this.messages = this.messages.filter((msg) => msg.id !== id)
  }

  async send(userText: string): Promise<void> {
    const userMsg: AgentMessage = {
      id: uuid(),
      role: 'user',
      content: userText,
    }
    this.addMessage(userMsg)

    const assistantMsg: AgentMessage = {
      id: uuid(),
      role: 'assistant',
      content: '',
      generating: true,
    }
    this.addMessage(assistantMsg)
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

    for (const m of this.messages) {
      if (m.generating) {
        const patch: Partial<AgentMessage> = { generating: false }
        if (m.toolStatus === 'running') patch.toolStatus = 'error'
        this.updateMessage(m.id, patch)
      }
    }
    this.isGenerating = false
  }

  private addMessage(msg: AgentMessage) {
    this.messages.push(msg)
  }

  private updateMessage(id: string, patch: Partial<AgentMessage>) {
    const msg = this.messages.find((item) => item.id === id)
    if (!msg) return
    Object.assign(msg, patch)
  }

  private buildHistory(excludeMsgId: string): tinker.AiMessage[] {
    const history: tinker.AiMessage[] = []

    if (this.systemPrompt.trim()) {
      history.push({ role: 'system', content: this.systemPrompt.trim() })
    }

    for (const m of this.messages) {
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
        this.updateMessage(assistantMsgId, { generating: false })
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
              this.updateMessage(assistantMsgId, {
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
              this.updateMessage(assistantMsgId, { content: fullContent })
            }

            if (chunk.toolCalls && chunk.toolCalls.length > 0) {
              accToolCalls = accumulateToolCalls(
                accToolCalls,
                chunk.toolCalls as Record<string, unknown>[]
              )
            }

            if (chunk.done) {
              done = true
              this.updateMessage(assistantMsgId, { generating: false })
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

      this.updateMessage(assistantMsgId, { toolCalls: accToolCalls })

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
      this.addMessage(nextAssistantMsg)
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
    this.addMessage(toolMsg)

    if (!tool) {
      this.updateMessage(toolMsg.id, {
        content: formatUnknownToolError(toolName, this.toolMap),
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
    this.updateMessage(toolMsg.id, {
      ...extraPatch,
      content,
      generating: false,
      toolStatus: isError ? 'error' : 'done',
    })
  }
}
