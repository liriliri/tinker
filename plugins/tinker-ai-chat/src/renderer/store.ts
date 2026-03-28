import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import BaseStore from 'share/BaseStore'
import { Agent } from 'share/lib/Agent'
import type { AgentTool } from 'share/lib/Agent'
import { WEB_SEARCH_TOOL, formatWebSearchResults } from 'share/tools/web'
import * as db from './lib/db'
import type { Session } from './types'

const storage = new LocalStore('tinker-ai-chat')

const ACTIVE_SESSION_KEY = 'activeSessionId'
const PROVIDER_KEY = 'provider'
const MODEL_KEY = 'model'

const WEB_SEARCH_AGENT_TOOL: AgentTool = {
  definition: WEB_SEARCH_TOOL,
  execute: async (args) => {
    const query = typeof args.query === 'string' ? args.query : ''
    const results = await aiChat.webSearch(query)
    return {
      content: formatWebSearchResults(results),
      searchResults: results,
    }
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

class Store extends BaseStore {
  sessions: Session[] = []
  activeSessionId: string = ''

  providers: tinker.AiProviderInfo[] = []
  selectedProvider: string = ''
  selectedModel: string = ''

  input: string = ''

  private agent: Agent

  constructor() {
    super()
    makeAutoObservable(this)
    this.agent = new Agent({
      maxIterations: 3,
      tools: [WEB_SEARCH_AGENT_TOOL],
      onMessage: (msg) => {
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
      },
      onMessageUpdate: (id, patch) => {
        const session = this.activeSession
        if (!session) return
        const msg = session.messages.find((m) => m.id === id)
        if (!msg) return
        Object.assign(msg, patch)
        if (patch.content !== undefined || patch.searchResults !== undefined) {
          this.saveActiveSession()
        }
      },
      getMessages: () => this.activeSession?.messages ?? [],
    })
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

  get isGenerating(): boolean {
    return this.agent.isGenerating
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
    this.agent.setProvider(name)
    this.agent.setModel(firstModel)
  }

  setSelectedModel(name: string) {
    this.selectedModel = name
    storage.set(MODEL_KEY, name)
    this.agent.setModel(name)
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
    this.agent.setProvider(provider)
    this.agent.setModel(model)
  }

  setSystemPrompt(val: string) {
    const session = this.activeSession
    if (!session) return
    session.systemPrompt = val
    this.agent.setSystemPrompt(val)
    this.saveActiveSession()
  }

  selectSession(id: string) {
    this.activeSessionId = id
    storage.set(ACTIVE_SESSION_KEY, id)
    const session = this.sessions.find((s) => s.id === id)
    this.agent.setSystemPrompt(session?.systemPrompt ?? '')
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
    this.agent.setSystemPrompt('')
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
      const active = this.sessions.find((s) => s.id === this.activeSessionId)
      this.agent.setSystemPrompt(active?.systemPrompt ?? '')
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

  async sendMessage() {
    if (!this.canSend) return
    const userText = this.input.trim()
    this.input = ''
    this.agent.setProvider(this.selectedProvider)
    this.agent.setModel(this.selectedModel)
    this.agent.setSystemPrompt(this.systemPrompt)
    await this.agent.send(userText)
  }

  abortGeneration() {
    this.agent.abort()
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
    this.agent.setProvider(this.selectedProvider)
    this.agent.setModel(this.selectedModel)
    this.agent.setSystemPrompt(this.systemPrompt)
    await this.agent.send(userContent)
  }

  deleteMessage(id: string) {
    const session = this.activeSession
    if (!session) return
    session.messages = session.messages.filter((m) => m.id !== id)
    this.saveActiveSession()
  }
}

export default new Store()
