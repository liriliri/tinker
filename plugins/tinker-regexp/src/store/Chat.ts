import { makeAutoObservable, runInAction } from 'mobx'
import * as chatDb from '../lib/chatDb'
import {
  createEmptySession,
  createSessionFromData,
  hasSessionContent,
  serializeSession,
} from '../lib/chatSession'
import storage, { STORAGE_MODEL, STORAGE_PROVIDER } from './storage'

export default class Chat {
  session = createEmptySession()

  providers: tinker.AiProviderInfo[] = []
  selectedProvider: string = ''
  selectedModel: string = ''

  input: string = ''

  constructor() {
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
