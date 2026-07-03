import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { Agent } from 'share/lib/Agent'
import * as chatDb from './lib/chatDb'
import { REGEXP_AGENT_TOOLS } from './lib/chatTools'
import type { Session, SessionData } from './types/chat'

const storage = new LocalStore('tinker-regexp-chat')

const STORAGE_PROVIDER = 'provider'
const STORAGE_MODEL = 'model'

const DEFAULT_SYSTEM_PROMPT =
  'You are a regular expression assistant. Help the user write, debug, and understand JavaScript regular expressions. You have tools to read and update the editor pattern, flags, and test text. Use tools only when you need current editor values or must apply changes. After reading or updating, reply to the user with a clear explanation. Do not call tools again unless the user asks for another change or check.'

function createAgent(initialMessages: SessionData['messages'] = []) {
  return new Agent({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    tools: REGEXP_AGENT_TOOLS,
    initialMessages,
  })
}

function createSessionFromData(session: SessionData): Session {
  return {
    id: session.id,
    createdAt: session.createdAt,
    agent: createAgent(session.messages),
  }
}

function serializeSession(session: Session): SessionData {
  return {
    id: session.id,
    messages: session.agent.getMessages(),
    createdAt: session.createdAt,
  }
}

function hasSessionContent(session: SessionData): boolean {
  return session.messages.some(
    (message) =>
      (message.role === 'user' || message.role === 'assistant') &&
      message.content.trim().length > 0
  )
}

function createEmptySession(): Session {
  return {
    id: chatDb.SESSION_ID,
    createdAt: Date.now(),
    agent: createAgent(),
  }
}

class ChatStore extends BaseStore {
  session: Session = createEmptySession()

  providers: tinker.AiProviderInfo[] = []
  selectedProvider: string = ''
  selectedModel: string = ''

  input: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    this.loadDb()
  }

  private loadStorage() {
    this.selectedProvider = storage.get(STORAGE_PROVIDER) || ''
    this.selectedModel = storage.get(STORAGE_MODEL) || ''
  }

  private async loadDb() {
    const [savedSession] = await Promise.all([
      chatDb.getSession(),
      this.loadProviders(),
    ])

    runInAction(() => {
      if (savedSession) {
        this.session = createSessionFromData(savedSession)
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
          this.selectedModel = providers[0].models[0]?.name || ''
          storage.set(STORAGE_PROVIDER, this.selectedProvider)
          storage.set(STORAGE_MODEL, this.selectedModel)
        } else {
          const hasModel = provider.models.some(
            (m) => m.name === this.selectedModel
          )
          if (!hasModel) {
            this.selectedModel = provider.models[0]?.name || ''
            storage.set(STORAGE_MODEL, this.selectedModel)
          }
        }
      }
    })
  }

  get isGenerating(): boolean {
    return this.session.agent.isGenerating
  }

  get messages() {
    return this.session.agent.getMessages()
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

  setSelectedCombined(val: string) {
    const idx = val.indexOf(':')
    if (idx === -1) return
    const provider = val.slice(0, idx)
    const model = val.slice(idx + 1)
    this.selectedProvider = provider
    storage.set(STORAGE_PROVIDER, provider)
    this.selectedModel = model
    storage.set(STORAGE_MODEL, model)
  }

  clearMessages() {
    this.session.agent.clearMessages()
    this.saveSession()
  }

  private saveSession() {
    const data = serializeSession(this.session)
    if (hasSessionContent(data)) {
      chatDb.putSession(data)
      return
    }
    chatDb.removeSession()
  }

  async sendMessage() {
    if (!this.canSend) return
    const userText = this.input.trim()
    this.input = ''
    const agent = this.session.agent
    agent.setProvider(this.selectedProvider)
    agent.setModel(this.selectedModel)
    await agent.send(userText)
    this.saveSession()
  }

  abortGeneration() {
    this.session.agent.abort()
    this.saveSession()
  }

  async retryLastMessage() {
    if (this.isGenerating) return

    const agent = this.session.agent
    const messages = agent.getMessages()
    let lastUserIdx = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIdx = i
        break
      }
    }
    if (lastUserIdx === -1) return

    const userContent = messages[lastUserIdx].content
    agent.setMessages(messages.slice(0, lastUserIdx))
    this.saveSession()
    agent.setProvider(this.selectedProvider)
    agent.setModel(this.selectedModel)
    await agent.send(userContent)
    this.saveSession()
  }

  deleteMessage(id: string) {
    this.session.agent.deleteMessage(id)
    this.saveSession()
  }
}

export default new ChatStore()
