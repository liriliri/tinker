import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import jsonClone from 'licia/jsonClone'
import BaseStore from 'share/BaseStore'
import * as db from './lib/db'
import { TOOLS } from './lib/tools'
import { formatResults } from './lib/search'
import i18n from './i18n'
import type { ChatMessage, Session, ToolCall } from './types'
import type { SearchResult } from '../common/types'

const storage = new LocalStore('tinker-ai-assistant')

const PROVIDER_KEY = 'provider'
const MODEL_KEY = 'model'
const WORKING_DIR_KEY = 'workingDir'

const MAX_TOOL_ITERATIONS = 20

function createSession(workingDir: string): Session {
  return {
    messages: [],
    workingDir,
  }
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

class Store extends BaseStore {
  session: Session = createSession('')

  providers: tinker.AiProviderInfo[] = []
  selectedProvider: string = ''
  selectedModel: string = ''

  workingDir: string = ''

  input: string = ''
  isGenerating: boolean = false

  private streamTask: tinker.AiStreamTask | null = null
  private aborted: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    this.selectedProvider = storage.get(PROVIDER_KEY) || ''
    this.selectedModel = storage.get(MODEL_KEY) || ''
    const savedWorkingDir: string =
      storage.get(WORKING_DIR_KEY) || aiAssistant.getHomeDir()
    this.workingDir = savedWorkingDir

    const [savedSession] = await Promise.all([
      db.loadSession(),
      this.loadProviders(),
    ])

    runInAction(() => {
      this.workingDir = savedWorkingDir
      if (savedSession) {
        this.session = savedSession
      } else {
        this.session = createSession(savedWorkingDir)
      }
    })
  }

  private async loadProviders() {
    const providers = await tinker.getAIProviders()
    runInAction(() => {
      this.providers = providers
      if (providers.length > 0) {
        const provider = providers.find((p) => p.name === this.selectedProvider)
        if (!provider) {
          this.selectedProvider = providers[0].name
          const firstModel = providers[0].models[0]?.name || ''
          this.selectedModel = firstModel
          storage.set(PROVIDER_KEY, this.selectedProvider)
          storage.set(MODEL_KEY, this.selectedModel)
        } else {
          const hasModel = provider.models.some(
            (m) => m.name === this.selectedModel
          )
          if (!hasModel) {
            this.selectedModel = provider.models[0]?.name || ''
            storage.set(MODEL_KEY, this.selectedModel)
          }
        }
      }
    })
  }

  get messages(): ChatMessage[] {
    return this.session.messages
  }

  get currentModels(): tinker.AiModel[] {
    const provider = this.providers.find(
      (p) => p.name === this.selectedProvider
    )
    return provider?.models || []
  }

  get combinedOptions(): Array<{ value: string; label: string }> {
    return this.providers.flatMap((p) =>
      p.models.map((m) => ({
        value: `${p.name}:${m.name}`,
        label: `${p.name}:${m.name}`,
      }))
    )
  }

  get selectedCombined(): string {
    if (!this.selectedProvider || !this.selectedModel) return ''
    return `${this.selectedProvider}:${this.selectedModel}`
  }

  get canSend(): boolean {
    return (
      this.input.trim().length > 0 &&
      !this.isGenerating &&
      this.providers.length > 0 &&
      !!this.selectedProvider &&
      !!this.selectedModel
    )
  }

  setInput(val: string) {
    this.input = val
  }

  setSelectedProvider(name: string) {
    this.selectedProvider = name
    storage.set(PROVIDER_KEY, name)
    const provider = this.providers.find((p) => p.name === name)
    const firstModel = provider?.models[0]?.name || ''
    this.selectedModel = firstModel
    storage.set(MODEL_KEY, firstModel)
  }

  setSelectedModel(name: string) {
    this.selectedModel = name
    storage.set(MODEL_KEY, name)
  }

  setSelectedCombined(val: string) {
    const idx = val.indexOf(':')
    if (idx === -1) return
    const provider = val.slice(0, idx)
    const model = val.slice(idx + 1)
    this.selectedProvider = provider
    storage.set(PROVIDER_KEY, provider)
    this.selectedModel = model
    storage.set(MODEL_KEY, model)
  }

  setWorkingDir(dir: string) {
    this.workingDir = dir
    storage.set(WORKING_DIR_KEY, dir)
    this.session.workingDir = dir
    this.saveSession()
  }

  clearMessages() {
    this.session.messages = []
    this.saveSession()
  }

  private saveSession() {
    const hasContent = this.session.messages.some(
      (m) => (m.role === 'user' || m.role === 'assistant') && m.content
    )
    if (hasContent) {
      db.saveSession(this.session)
    }
  }

  private addMessage(msg: ChatMessage) {
    this.session.messages.push(msg)
    this.saveSession()
  }

  private buildHistory(excludeMsgId: string): tinker.AiMessage[] {
    const history: tinker.AiMessage[] = []

    const now = new Date()
    const dateStr = now.toLocaleString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    const { platform } = aiAssistant.getSystemInfo()

    const systemParts = [
      "You are a helpful AI assistant. You have access to tools to complete tasks on the user's computer.",
      `Current date/time: ${dateStr}`,
      `Platform: ${platform}`,
      `Working directory: ${this.session.workingDir || this.workingDir}`,
    ]
    history.push({ role: 'system', content: systemParts.join('\n') })

    for (const m of this.session.messages) {
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

  async sendMessage() {
    if (!this.canSend) return
    const userText = this.input.trim()
    this.input = ''
    await this.sendContent(userText)
  }

  private async sendContent(userText: string) {
    const userMsg: ChatMessage = {
      id: uuid(),
      role: 'user',
      content: userText,
    }
    this.addMessage(userMsg)

    const assistantMsg: ChatMessage = {
      id: uuid(),
      role: 'assistant',
      content: '',
      generating: true,
    }
    this.addMessage(assistantMsg)
    this.isGenerating = true
    this.aborted = false

    await this.runAILoop(assistantMsg.id, 0)
  }

  private async runAILoop(
    assistantMsgId: string,
    iteration: number
  ): Promise<void> {
    if (this.aborted || iteration >= MAX_TOOL_ITERATIONS) {
      runInAction(() => {
        const msg = this.session.messages.find((m) => m.id === assistantMsgId)
        if (msg) msg.generating = false
        this.isGenerating = false
      })
      return
    }

    const history = this.buildHistory(assistantMsgId)
    let fullContent = ''
    let accToolCalls: ToolCall[] = []
    let done = false

    const assistantMsg = this.session.messages.find(
      (m) => m.id === assistantMsgId
    )

    await new Promise<void>((resolve) => {
      this.streamTask = tinker.callAIStream(
        jsonClone({
          provider: this.selectedProvider,
          model: this.selectedModel,
          messages: history,
          tools: [...TOOLS],
        }),
        (chunk) => {
          runInAction(() => {
            if (this.aborted) {
              resolve()
              return
            }

            const msg = assistantMsg
            if (!msg) return

            if (chunk.error) {
              msg.generating = false
              msg.error = chunk.error
              this.isGenerating = false
              this.streamTask = null
              resolve()
              return
            }

            if (chunk.content) {
              fullContent += chunk.content
              msg.content = fullContent
            }

            if (chunk.toolCalls && chunk.toolCalls.length > 0) {
              accToolCalls = accumulateToolCalls(accToolCalls, chunk.toolCalls)
            }

            if (chunk.done) {
              done = true
              msg.generating = false
              this.streamTask = null
              resolve()
            }
          })
        }
      )
    })

    if (!done || this.aborted) {
      runInAction(() => {
        this.isGenerating = false
      })
      return
    }

    if (accToolCalls.length === 0) {
      runInAction(() => {
        this.isGenerating = false
        this.saveSession()
      })
      return
    }

    runInAction(() => {
      const msg = this.session.messages.find((m) => m.id === assistantMsgId)
      if (msg) msg.toolCalls = accToolCalls
    })

    for (const toolCall of accToolCalls) {
      if (this.aborted) break
      await this.executeToolCall(toolCall)
    }

    if (this.aborted) {
      runInAction(() => {
        this.isGenerating = false
      })
      return
    }

    const nextAssistantMsg: ChatMessage = {
      id: uuid(),
      role: 'assistant',
      content: '',
      generating: true,
    }
    runInAction(() => this.addMessage(nextAssistantMsg))

    await this.runAILoop(nextAssistantMsg.id, iteration + 1)
  }

  private async executeToolCall(toolCall: ToolCall): Promise<void> {
    const toolName = toolCall.function.name
    let args: Record<string, unknown> = {}
    try {
      args = JSON.parse(toolCall.function.arguments)
    } catch {
      // ignore parse error
    }

    const workingDir =
      this.session.workingDir || this.workingDir || aiAssistant.getHomeDir()

    const toolMsg: ChatMessage = {
      id: uuid(),
      role: 'tool',
      content: '',
      toolCallId: toolCall.id,
      toolName,
      toolArgs: args,
      toolStatus: 'running',
      generating: true,
    }

    if (toolName === 'web_search') {
      toolMsg.isSearching = true
      toolMsg.searchQuery = typeof args.query === 'string' ? args.query : ''
    }

    runInAction(() => this.addMessage(toolMsg))

    let resultContent = ''

    try {
      switch (toolName) {
        case 'exec': {
          const command = typeof args.command === 'string' ? args.command : ''
          const timeout =
            typeof args.timeout === 'number' ? args.timeout : undefined
          resultContent = await aiAssistant.exec(command, workingDir, timeout)
          break
        }
        case 'read_file': {
          const filePath = typeof args.path === 'string' ? args.path : ''
          const offset =
            typeof args.offset === 'number' ? args.offset : undefined
          const limit = typeof args.limit === 'number' ? args.limit : undefined
          resultContent = aiAssistant.readFile(
            filePath,
            workingDir,
            offset,
            limit
          )
          break
        }
        case 'write_file': {
          const filePath = typeof args.path === 'string' ? args.path : ''
          const content = typeof args.content === 'string' ? args.content : ''
          resultContent = aiAssistant.writeFile(filePath, content, workingDir)
          break
        }
        case 'edit_file': {
          const filePath = typeof args.path === 'string' ? args.path : ''
          const oldText = typeof args.old_text === 'string' ? args.old_text : ''
          const newText = typeof args.new_text === 'string' ? args.new_text : ''
          const replaceAll =
            typeof args.replace_all === 'boolean' ? args.replace_all : false
          resultContent = aiAssistant.editFile(
            filePath,
            oldText,
            newText,
            workingDir,
            replaceAll
          )
          break
        }
        case 'list_dir': {
          const dirPath = typeof args.path === 'string' ? args.path : '.'
          const recursive =
            typeof args.recursive === 'boolean' ? args.recursive : false
          const maxEntries =
            typeof args.max_entries === 'number' ? args.max_entries : undefined
          resultContent = aiAssistant.listDir(
            dirPath,
            workingDir,
            recursive,
            maxEntries
          )
          break
        }
        case 'web_search': {
          const query = typeof args.query === 'string' ? args.query : ''
          const lang = i18n.language
          let searchResults: SearchResult[] = []
          try {
            searchResults = await aiAssistant.webSearch(query, lang)
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : 'Search failed'
            runInAction(() => {
              const tm = this.session.messages.find((m) => m.id === toolMsg.id)
              if (!tm) return
              tm.isSearching = false
              tm.generating = false
              tm.toolStatus = 'error'
              tm.error = errMsg
              tm.content = `Search failed: ${errMsg}`
              this.saveSession()
            })
            return
          }
          runInAction(() => {
            const tm = this.session.messages.find((m) => m.id === toolMsg.id)
            if (!tm) return
            tm.isSearching = false
            tm.searchResults = searchResults
            tm.content = formatResults(searchResults)
            tm.generating = false
            tm.toolStatus = 'done'
            this.saveSession()
          })
          return
        }
        case 'web_fetch': {
          const url = typeof args.url === 'string' ? args.url : ''
          resultContent = await aiAssistant.webFetch(url)
          break
        }
        default:
          resultContent = `Error: Unknown tool "${toolName}"`
      }
    } catch (e) {
      resultContent = `Error: ${e instanceof Error ? e.message : String(e)}`
    }

    runInAction(() => {
      const tm = this.session.messages.find((m) => m.id === toolMsg.id)
      if (!tm) return
      tm.content = resultContent
      tm.generating = false
      tm.toolStatus = resultContent.startsWith('Error') ? 'error' : 'done'
      this.saveSession()
    })
  }

  abortGeneration() {
    this.aborted = true
    if (this.streamTask) {
      this.streamTask.abort()
      this.streamTask = null
    }
    runInAction(() => {
      for (const m of this.session.messages) {
        if (m.generating) {
          m.generating = false
          if (m.isSearching) m.isSearching = false
          if (m.toolStatus === 'running') m.toolStatus = 'error'
        }
      }
      this.isGenerating = false
    })
  }

  async retryLastMessage() {
    if (this.isGenerating) return

    const messages = this.session.messages
    let lastUserIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIdx = i
        break
      }
    }
    if (lastUserIdx === -1) return

    const userContent = messages[lastUserIdx].content
    this.session.messages = messages.slice(0, lastUserIdx)
    this.saveSession()
    await this.sendContent(userContent)
  }

  deleteMessage(id: string) {
    this.session.messages = this.session.messages.filter((m) => m.id !== id)
    this.saveSession()
  }
}

export default new Store()
