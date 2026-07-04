import { makeAutoObservable, runInAction } from 'mobx'
import type { ChatPrefsStorage } from '../lib/aiChat/chatPrefsStorage'
import type { ChatSession } from '../lib/aiChat/chatSession'
import type { AiChatProvidersApi } from '../lib/aiChat/providers'
import aiChatProviders from '../lib/aiChat/providers'
import type { ChatSessionStorage } from '../lib/aiChat/chatStorage'
import type { Session } from '../lib/aiChat/types'

export interface AiChatStoreOptions {
  chatSession: ChatSession
  sessionStorage: ChatSessionStorage
  prefsStorage?: ChatPrefsStorage
  initialSystemPrompt?: string
  systemPromptEditable?: boolean
  providers?: AiChatProvidersApi
}

export default class AiChatStore {
  session: Session

  selectedProvider: string = ''
  selectedModel: string = ''

  input: string = ''
  systemPrompt: string = ''
  readonly systemPromptEditable: boolean

  constructor(private options: AiChatStoreOptions) {
    this.systemPrompt = options.initialSystemPrompt ?? ''
    this.systemPromptEditable = options.systemPromptEditable ?? false
    this.session = options.chatSession.createEmptySession()
    this.session.agent.setSystemPrompt(this.systemPrompt)
    makeAutoObservable(this)
    this.loadPrefs()
    void this.init()
  }

  private get sessionStorage() {
    return this.options.sessionStorage
  }

  private get chatSession() {
    return this.options.chatSession
  }

  private get prefsStorage() {
    return this.options.prefsStorage
  }

  private get providersStore() {
    return this.options.providers ?? aiChatProviders
  }

  get providers(): tinker.AiProviderInfo[] {
    return this.providersStore.providers
  }

  private loadPrefs() {
    if (!this.prefsStorage) return
    this.selectedProvider = this.prefsStorage.getProvider()
    this.selectedModel = this.prefsStorage.getModel()
  }

  private async init() {
    await Promise.all([
      this.sessionStorage.load().then((savedSession) => {
        runInAction(() => {
          if (savedSession) {
            if (savedSession.systemPrompt != null) {
              this.systemPrompt = savedSession.systemPrompt
            }
            this.session = this.chatSession.createSessionFromData(savedSession)
            this.session.agent.setSystemPrompt(this.systemPrompt)
          }
        })
      }),
      this.providersStore.ensureLoaded(),
    ])

    runInAction(() => {
      this.validatePrefs()
    })
  }

  private validatePrefs() {
    const providers = this.providers
    if (providers.length === 0) return

    const provider = providers.find((p) => p.name === this.selectedProvider)
    if (!provider) {
      this.selectedProvider = providers[0].name
      this.selectedModel = providers[0].models[0]?.name || ''
      this.prefsStorage?.setProvider(this.selectedProvider)
      this.prefsStorage?.setModel(this.selectedModel)
      return
    }

    const hasModel = provider.models.some((m) => m.name === this.selectedModel)
    if (!hasModel) {
      this.selectedModel = provider.models[0]?.name || ''
      this.prefsStorage?.setModel(this.selectedModel)
    }
  }

  setSystemPrompt(val: string) {
    this.systemPrompt = val
    this.session.agent.setSystemPrompt(val)
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
    this.prefsStorage?.setProvider(provider)
    this.selectedModel = model
    this.prefsStorage?.setModel(model)
  }

  clearMessages() {
    this.session.agent.clearMessages()
    this.saveSession()
  }

  private saveSession() {
    const data = {
      ...this.chatSession.serializeSession(this.session),
      systemPrompt: this.systemPrompt,
    }
    if (this.chatSession.hasSessionContent(data)) {
      void this.sessionStorage.save(data)
      return
    }
    void this.sessionStorage.clear()
  }

  async sendMessage() {
    if (!this.canSend) return
    const userText = this.input.trim()
    this.input = ''
    const agent = this.session.agent
    agent.setProvider(this.selectedProvider)
    agent.setModel(this.selectedModel)
    agent.setSystemPrompt(this.systemPrompt)
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
    agent.setSystemPrompt(this.systemPrompt)
    await agent.send(userContent)
    this.saveSession()
  }

  deleteMessage(id: string) {
    this.session.agent.deleteMessage(id)
    this.saveSession()
  }
}
