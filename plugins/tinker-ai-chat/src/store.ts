import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import BaseStore from 'share/BaseStore'
import * as db from './lib/db'
import type { ChatMessage, Session } from './types'

const storage = new LocalStore('tinker-ai-chat')

const ACTIVE_SESSION_KEY = 'activeSessionId'
const PROVIDER_KEY = 'provider'
const MODEL_KEY = 'model'

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
  isGenerating: boolean = false

  private streamTask: tinker.AiStreamTask | null = null

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
        const hasProvider = providers.some(
          (p) => p.name === this.selectedProvider
        )
        if (!hasProvider) {
          this.selectedProvider = providers[0].name
          const firstModel = providers[0].models[0]?.name || ''
          this.selectedModel = firstModel
          storage.set(PROVIDER_KEY, this.selectedProvider)
          storage.set(MODEL_KEY, this.selectedModel)
        } else {
          const provider = providers.find(
            (p) => p.name === this.selectedProvider
          )!
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

  get providerOptions(): Array<{ value: string; label: string }> {
    return this.providers.map((p) => ({ value: p.name, label: p.name }))
  }

  get modelOptions(): Array<{ value: string; label: string }> {
    return this.currentModels.map((m) => ({ value: m.name, label: m.name }))
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
    if (session.messages.length > 0) {
      db.putSession(session)
    } else {
      db.removeSession(session.id)
    }
  }

  private addMessage(msg: ChatMessage) {
    const session = this.activeSession
    if (!session) return
    session.messages.push(msg)
    if (session.messages.length === 1 && msg.role === 'user') {
      session.title = msg.content.slice(0, 40)
    }
    this.saveActiveSession()
  }

  private updateLastAssistantMessage(patch: Partial<ChatMessage>) {
    const session = this.activeSession
    if (!session) return
    const msgs = session.messages
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant') {
        Object.assign(msgs[i], patch)
        break
      }
    }
    this.saveActiveSession()
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

    const session = this.activeSession!
    const history: tinker.AiMessage[] = []
    if (this.systemPrompt.trim()) {
      history.push({ role: 'system', content: this.systemPrompt.trim() })
    }
    for (const m of session.messages) {
      if (m.generating) continue
      if (m.id === assistantMsg.id) continue
      history.push({ role: m.role, content: m.content })
    }

    let fullContent = ''

    this.streamTask = tinker.callAIStream(
      {
        provider: this.selectedProvider,
        model: this.selectedModel,
        messages: history,
      },
      (chunk) => {
        runInAction(() => {
          if (chunk.error) {
            this.updateLastAssistantMessage({
              generating: false,
              error: chunk.error,
            })
            this.isGenerating = false
            this.streamTask = null
            return
          }
          if (chunk.content) {
            fullContent += chunk.content
            this.updateLastAssistantMessage({ content: fullContent })
          }
          if (chunk.done) {
            this.updateLastAssistantMessage({ generating: false })
            this.isGenerating = false
            this.streamTask = null
          }
        })
      }
    )
  }

  abortGeneration() {
    if (this.streamTask) {
      this.streamTask.abort()
      this.streamTask = null
    }
    this.updateLastAssistantMessage({ generating: false })
    this.isGenerating = false
  }

  retryLastMessage() {
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
    this.sendContent(userContent)
  }

  deleteMessage(id: string) {
    const session = this.activeSession
    if (!session) return
    session.messages = session.messages.filter((m) => m.id !== id)
    this.saveActiveSession()
  }
}

export default new Store()
