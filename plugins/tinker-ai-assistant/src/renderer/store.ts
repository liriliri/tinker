import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { Agent } from 'share/lib/Agent'
import type { AgentMessage, AgentTool } from 'share/lib/Agent'
import { createWebSearchToolResult } from 'share/tools/web'
import * as db from './lib/db'
import { TOOLS } from './lib/tools'
import i18n from './i18n'
import type { Session, SessionData } from './types'

const storage = new LocalStore('tinker-ai-assistant')

const PROVIDER_KEY = 'provider'
const MODEL_KEY = 'model'
const WORKING_DIR_KEY = 'workingDir'

function buildAgentTools(getWorkingDir: () => string): AgentTool[] {
  return TOOLS.map((toolDef) => {
    const name = (toolDef as { function: { name: string } }).function.name
    const tool: AgentTool = {
      definition: toolDef,
      execute: async (args) => {
        const workingDir = getWorkingDir()
        switch (name) {
          case 'exec': {
            const command = typeof args.command === 'string' ? args.command : ''
            const timeout =
              typeof args.timeout === 'number' ? args.timeout : undefined
            return aiAssistant.exec(command, workingDir, timeout)
          }
          case 'read_file': {
            const filePath = typeof args.path === 'string' ? args.path : ''
            const offset =
              typeof args.offset === 'number' ? args.offset : undefined
            const limit =
              typeof args.limit === 'number' ? args.limit : undefined
            return aiAssistant.readFile(filePath, workingDir, offset, limit)
          }
          case 'write_file': {
            const filePath = typeof args.path === 'string' ? args.path : ''
            const content = typeof args.content === 'string' ? args.content : ''
            return aiAssistant.writeFile(filePath, content, workingDir)
          }
          case 'edit_file': {
            const filePath = typeof args.path === 'string' ? args.path : ''
            const oldText =
              typeof args.old_text === 'string' ? args.old_text : ''
            const newText =
              typeof args.new_text === 'string' ? args.new_text : ''
            const replaceAll =
              typeof args.replace_all === 'boolean' ? args.replace_all : false
            return aiAssistant.editFile(
              filePath,
              oldText,
              newText,
              workingDir,
              replaceAll
            )
          }
          case 'list_dir': {
            const dirPath = typeof args.path === 'string' ? args.path : '.'
            const recursive =
              typeof args.recursive === 'boolean' ? args.recursive : false
            const maxEntries =
              typeof args.max_entries === 'number'
                ? args.max_entries
                : undefined
            return aiAssistant.listDir(
              dirPath,
              workingDir,
              recursive,
              maxEntries
            )
          }
          case 'web_search': {
            const query = typeof args.query === 'string' ? args.query : ''
            const results = await aiAssistant.webSearch(query)
            return createWebSearchToolResult(results)
          }
          case 'web_fetch': {
            const url = typeof args.url === 'string' ? args.url : ''
            return aiAssistant.webFetch(url)
          }
          default:
            return `Error: Unknown tool "${name}"`
        }
      },
    }
    return tool
  })
}

function createSession(workingDir: string): Session {
  return {
    workingDir,
    agent: createAgent(workingDir),
  }
}

function createAgent(
  workingDir: string,
  initialMessages: SessionData['messages'] = []
) {
  return new Agent({
    maxIterations: 3,
    tools: buildAgentTools(() => workingDir || aiAssistant.getHomeDir()),
    initialMessages,
  })
}

function createSessionFromData(session: SessionData): Session {
  return {
    workingDir: session.workingDir,
    agent: createAgent(session.workingDir, session.messages),
  }
}

function serializeSession(session: Session): SessionData {
  return {
    workingDir: session.workingDir,
    messages: session.agent.getMessages(),
  }
}

class Store extends BaseStore {
  session: Session = createSession('')

  providers: tinker.AiProviderInfo[] = []
  selectedProvider: string = ''
  selectedModel: string = ''

  workingDir: string = ''

  input: string = ''

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
        this.session = createSessionFromData(savedSession)
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
      `Working directory: ${this.session.workingDir || this.workingDir}`,
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
    this.session = {
      workingDir: dir,
      agent: createAgent(dir, this.session.agent.getMessages()),
    }
    this.saveSession()
  }

  clearMessages() {
    this.session.agent.clearMessages()
    this.saveSession()
  }

  private saveSession() {
    const data = serializeSession(this.session)
    const hasContent = data.messages.some(
      (m) => (m.role === 'user' || m.role === 'assistant') && m.content
    )
    if (hasContent) {
      db.saveSession(data)
    } else {
      db.saveSession(data)
    }
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
