import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import i18n from 'i18next'
import BaseStore from 'share/store/Base'
import { Agent } from 'share/lib/Agent'
import type { AgentMessage } from 'share/lib/Agent'
import { buildAssistantTools } from './lib/assistantTools'
import * as sessionStorage from './lib/sessionStorage'

const storage = new LocalStore('tinker-ai-assistant')

const STORAGE_PROVIDER = 'provider'
const STORAGE_MODEL = 'model'
const STORAGE_WORKING_DIR = 'workingDir'

interface Session {
  agent: Agent
}

function createAgent(
  getWorkingDir: () => string,
  initialMessages: AgentMessage[] = []
) {
  return new Agent({
    maxIterations: 3,
    tools: buildAssistantTools(getWorkingDir),
    initialMessages,
  })
}

class Store extends BaseStore {
  session: Session = {
    agent: createAgent(() => this.workingDir || aiAssistant.getHomeDir()),
  }
  sessionLoaded = false

  providers: tinker.AiProviderInfo[] = []
  selectedProvider: string = ''
  selectedModel: string = ''

  workingDir: string = ''
  input: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    void this.loadDb()
  }

  private loadStorage() {
    this.selectedProvider = storage.get(STORAGE_PROVIDER) || ''
    this.selectedModel = storage.get(STORAGE_MODEL) || ''
    this.workingDir =
      storage.get(STORAGE_WORKING_DIR) || aiAssistant.getHomeDir()
  }

  private async loadDb() {
    const savedWorkingDir = this.workingDir
    const [savedSession] = await Promise.all([
      sessionStorage.loadSession(),
      this.loadProviders(),
    ])

    runInAction(() => {
      this.workingDir = savedWorkingDir
      if (savedSession) {
        this.session = {
          agent: createAgent(
            () => this.workingDir || aiAssistant.getHomeDir(),
            savedSession.messages
          ),
        }
      }
      this.sessionLoaded = true
    })
  }

  private async loadProviders() {
    const providers = await tinker.getAIProviders()
    runInAction(() => {
      this.providers = providers
      if (providers.length === 0) return

      const provider = providers.find((p) => p.name === this.selectedProvider)
      if (!provider) {
        this.selectedProvider = providers[0].name
        this.selectedModel = providers[0].models[0]?.name || ''
        storage.set(STORAGE_PROVIDER, this.selectedProvider)
        storage.set(STORAGE_MODEL, this.selectedModel)
        return
      }

      const hasModel = provider.models.some(
        (m) => m.name === this.selectedModel
      )
      if (!hasModel) {
        this.selectedModel = provider.models[0]?.name || ''
        storage.set(STORAGE_MODEL, this.selectedModel)
      }
    })
  }

  private buildSystemPrompt(): string {
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
    return [
      "You are a helpful AI assistant. You have access to tools to complete tasks on the user's computer.",
      `Current date/time: ${dateStr}`,
      `Platform: ${platform}`,
      `Working directory: ${this.workingDir}`,
    ].join('\n')
  }

  get messages(): AgentMessage[] {
    return this.session.agent.getMessages()
  }

  get isGenerating(): boolean {
    return this.session.agent.isGenerating
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
      this.sessionLoaded &&
      this.input.trim().length > 0 &&
      !this.isGenerating &&
      this.providers.length > 0 &&
      !!this.selectedProvider &&
      !!this.selectedModel
    )
  }

  get workingDirBasename(): string {
    return this.workingDir.split('/').filter(Boolean).pop() ?? this.workingDir
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

  setWorkingDir(dir: string) {
    this.workingDir = dir
    storage.set(STORAGE_WORKING_DIR, dir)
    this.session = {
      agent: createAgent(
        () => this.workingDir || aiAssistant.getHomeDir(),
        this.session.agent.getMessages()
      ),
    }
    this.saveSession()
  }

  clearMessages() {
    this.session.agent.clearMessages()
    this.saveSession()
  }

  private saveSession() {
    void sessionStorage.saveSession({
      messages: this.session.agent.getMessages(),
      workingDir: this.workingDir,
    })
  }

  async sendMessage() {
    if (!this.canSend) return
    const userText = this.input.trim()
    this.input = ''
    const agent = this.session.agent
    agent.setProvider(this.selectedProvider)
    agent.setModel(this.selectedModel)
    agent.setSystemPrompt(this.buildSystemPrompt())
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
    agent.setSystemPrompt(this.buildSystemPrompt())
    await agent.send(userContent)
    this.saveSession()
  }

  deleteMessage(id: string) {
    this.session.agent.deleteMessage(id)
    this.saveSession()
  }
}

export default new Store()
