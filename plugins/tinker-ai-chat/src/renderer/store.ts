import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import jsonClone from 'licia/jsonClone'
import BaseStore from 'share/BaseStore'
import * as db from './lib/db'
import { search, formatResults } from './lib/search'
import i18n from './i18n'
import type { ChatMessage, Session, ToolCall } from './types'
import type { SearchResult } from '../common/types'

const storage = new LocalStore('tinker-ai-chat')

const ACTIVE_SESSION_KEY = 'activeSessionId'
const PROVIDER_KEY = 'provider'
const MODEL_KEY = 'model'

const MAX_TOOL_ITERATIONS = 3
const WEB_SEARCH_TOOL_NAME = 'web_search'

const WEB_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: WEB_SEARCH_TOOL_NAME,
    description:
      'Search the web for up-to-date information, recent news, or real-time data. Use this when the user asks about current events, facts that may have changed, or anything requiring fresh information.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The optimized search query string',
        },
      },
      required: ['query'],
    },
  },
}

function createSession(): Session {
  return {
    id: uuid(),
    title: '',
    messages: [],
    systemPrompt: '',
    createdAt: Date.now(),
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
  sessions: Session[] = []
  activeSessionId: string = ''

  providers: tinker.AiProviderInfo[] = []
  selectedProvider: string = ''
  selectedModel: string = ''

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

    const savedActiveId: string = storage.get(ACTIVE_SESSION_KEY) || ''
    const [savedSessions] = await Promise.all([
      db.getAllSessions(),
      this.loadProviders(),
    ])

    runInAction(() => {
      if (savedSessions.length > 0) {
        this.sessions = savedSessions.sort((a, b) => b.createdAt - a.createdAt)
        this.activeSessionId =
          savedSessions.find((s) => s.id === savedActiveId)?.id ||
          savedSessions[0].id
      } else {
        const session = createSession()
        this.sessions = [session]
        this.activeSessionId = session.id
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

  get activeSession(): Session | undefined {
    return this.sessions.find((s) => s.id === this.activeSessionId)
  }

  get systemPrompt(): string {
    return this.activeSession?.systemPrompt || ''
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

  setSystemPrompt(val: string) {
    const session = this.activeSession
    if (!session) return
    session.systemPrompt = val
    this.saveActiveSession()
  }

  selectSession(id: string) {
    this.activeSessionId = id
    storage.set(ACTIVE_SESSION_KEY, id)
  }

  newSession() {
    const latest = this.sessions[0]
    if (latest && latest.messages.length === 0) {
      this.selectSession(latest.id)
      return
    }
    const session = createSession()
    this.sessions.unshift(session)
    this.activeSessionId = session.id
    storage.set(ACTIVE_SESSION_KEY, session.id)
  }

  deleteSession(id: string) {
    const session = this.sessions.find((s) => s.id === id)
    this.sessions = this.sessions.filter((s) => s.id !== id)
    if (session && session.messages.length > 0) {
      db.removeSession(id)
    }
    if (this.activeSessionId === id) {
      if (this.sessions.length === 0) {
        const newSession = createSession()
        this.sessions = [newSession]
        this.activeSessionId = newSession.id
      } else {
        this.activeSessionId = this.sessions[0].id
      }
      storage.set(ACTIVE_SESSION_KEY, this.activeSessionId)
    }
  }

  clearMessages() {
    const session = this.activeSession
    if (!session) return
    session.messages = []
    session.title = ''
    this.saveActiveSession()
  }

  private saveActiveSession() {
    const session = this.activeSession
    if (!session) return
    const hasContent = session.messages.some(
      (m) => (m.role === 'user' || m.role === 'assistant') && m.content
    )
    if (hasContent) {
      db.putSession(session)
    } else {
      db.removeSession(session.id)
    }
  }

  private addMessage(msg: ChatMessage) {
    const session = this.activeSession
    if (!session) return
    session.messages.push(msg)
    if (msg.role === 'user') {
      let userCount = 0
      for (const m of session.messages) {
        if (m.role === 'user' && ++userCount > 1) break
      }
      if (userCount === 1) {
        session.title = msg.content.slice(0, 40)
      }
    }
    this.saveActiveSession()
  }

  private buildHistory(excludeMsgId: string): tinker.AiMessage[] {
    const session = this.activeSession
    if (!session) return []

    const history: tinker.AiMessage[] = []
    if (this.systemPrompt.trim()) {
      history.push({ role: 'system', content: this.systemPrompt.trim() })
    }

    for (const m of session.messages) {
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
        const session = this.activeSession
        if (!session) return
        const msg = session.messages.find((m) => m.id === assistantMsgId)
        if (msg) msg.generating = false
        this.isGenerating = false
      })
      return
    }

    const history = this.buildHistory(assistantMsgId)
    let fullContent = ''
    let accToolCalls: ToolCall[] = []
    let done = false

    const assistantMsg = this.activeSession?.messages.find(
      (m) => m.id === assistantMsgId
    )

    await new Promise<void>((resolve) => {
      this.streamTask = tinker.callAIStream(
        jsonClone({
          provider: this.selectedProvider,
          model: this.selectedModel,
          messages: history,
          tools: [WEB_SEARCH_TOOL],
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
        this.saveActiveSession()
      })
      return
    }

    runInAction(() => {
      const session = this.activeSession
      if (!session) return
      const msg = session.messages.find((m) => m.id === assistantMsgId)
      if (msg) msg.toolCalls = accToolCalls
    })

    for (const toolCall of accToolCalls) {
      if (toolCall.function.name !== WEB_SEARCH_TOOL_NAME) continue
      if (this.aborted) break

      let query = ''
      try {
        const args = JSON.parse(toolCall.function.arguments)
        query = args.query || ''
      } catch {
        continue
      }
      if (!query) continue

      const toolMsg: ChatMessage = {
        id: uuid(),
        role: 'tool',
        content: '',
        toolCallId: toolCall.id,
        toolName: WEB_SEARCH_TOOL_NAME,
        isSearching: true,
        searchQuery: query,
        generating: true,
      }
      runInAction(() => this.addMessage(toolMsg))

      let searchResult: { results?: SearchResult[]; error?: string } = {}
      try {
        const lang = i18n.language
        searchResult = { results: await search(query, lang) }
      } catch (e: unknown) {
        searchResult = {
          error: e instanceof Error ? e.message : 'Search failed',
        }
      }

      runInAction(() => {
        const session = this.activeSession
        if (!session) return
        const tm = session.messages.find((m) => m.id === toolMsg.id)
        if (!tm) return
        tm.isSearching = false
        tm.generating = false
        if (searchResult.results) {
          tm.searchResults = searchResult.results
          tm.content = formatResults(searchResult.results)
        } else {
          tm.error = searchResult.error
          tm.content = `Search failed: ${searchResult.error}`
        }
        this.saveActiveSession()
      })
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

  abortGeneration() {
    this.aborted = true
    if (this.streamTask) {
      this.streamTask.abort()
      this.streamTask = null
    }
    runInAction(() => {
      const session = this.activeSession
      if (session) {
        for (const m of session.messages) {
          if (m.generating) {
            m.generating = false
            if (m.isSearching) m.isSearching = false
          }
        }
      }
      this.isGenerating = false
    })
  }

  async retryLastMessage() {
    const session = this.activeSession
    if (!session || this.isGenerating) return

    const messages = session.messages
    let lastUserIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIdx = i
        break
      }
    }
    if (lastUserIdx === -1) return

    const userContent = messages[lastUserIdx].content
    session.messages = messages.slice(0, lastUserIdx)
    this.saveActiveSession()
    await this.sendContent(userContent)
  }

  deleteMessage(id: string) {
    const session = this.activeSession
    if (!session) return
    session.messages = session.messages.filter((m) => m.id !== id)
    this.saveActiveSession()
  }
}

export default new Store()
