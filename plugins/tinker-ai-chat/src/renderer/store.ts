import { makeAutoObservable, runInAction } from 'mobx'
import LocalStore from 'licia/LocalStore'
import uuid from 'licia/uuid'
import { LocalStoreChatPrefs } from 'share/lib/aiChat/chatPrefsStorage'
import { ChatSession } from 'share/lib/aiChat/chatSession'
import AiChatStore from 'share/store/AiChat'
import BaseStore from 'share/store/Base'
import { AI_CHAT_AGENT_TOOLS } from './lib/chatTools'
import { AiChatSessionStorage } from './lib/sessionStorage'
import type { AiChatPersistedSession } from './lib/sessionStorage'

const storage = new LocalStore('tinker-ai-chat')

const STORAGE_ACTIVE_SESSION = 'activeSessionId'

interface SessionEntry {
  sessionStorage: AiChatSessionStorage
  chat: AiChatStore
}

class Store extends BaseStore {
  entries: SessionEntry[] = []
  activeSessionId: string = ''

  private prefsStorage = new LocalStoreChatPrefs(storage)

  constructor() {
    super()
    makeAutoObservable(this)
    void this.loadDb()
  }

  private createEntry(sessionId: string): SessionEntry {
    const sessionStorage = new AiChatSessionStorage(sessionId)
    const chatSession = new ChatSession({
      sessionId,
      tools: AI_CHAT_AGENT_TOOLS,
      maxIterations: 3,
    })
    const chat = new AiChatStore({
      chatSession,
      sessionStorage,
      prefsStorage: this.prefsStorage,
      systemPromptEditable: true,
    })

    return { sessionStorage, chat }
  }

  private createEntryFromSaved(saved: AiChatPersistedSession): SessionEntry {
    const entry = this.createEntry(saved.id)
    entry.sessionStorage.title = saved.title
    return entry
  }

  private async loadDb() {
    const savedActiveId: string = storage.get(STORAGE_ACTIVE_SESSION) || ''
    const savedSessions = await AiChatSessionStorage.getAllSessions()

    runInAction(() => {
      if (savedSessions.length > 0) {
        this.entries = savedSessions
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((saved) => this.createEntryFromSaved(saved))
        this.activeSessionId =
          savedSessions.find((s) => s.id === savedActiveId)?.id ||
          savedSessions[0].id
      } else {
        const entry = this.createEntry(uuid())
        this.entries = [entry]
        this.activeSessionId = entry.sessionStorage.sessionId
      }
    })
  }

  get activeEntry(): SessionEntry | undefined {
    return this.entries.find(
      (entry) => entry.sessionStorage.sessionId === this.activeSessionId
    )
  }

  get activeChat(): AiChatStore | undefined {
    return this.activeEntry?.chat
  }

  get activeTitle(): string {
    return this.activeEntry?.sessionStorage.title ?? ''
  }

  get sessions() {
    return this.entries.map((entry) => ({
      id: entry.sessionStorage.sessionId,
      title: entry.sessionStorage.title,
    }))
  }

  private syncActiveTitle() {
    const entry = this.activeEntry
    if (!entry) return
    const messages = entry.chat.messages
    const firstUserMessage = messages.find((msg) => msg.role === 'user')
    entry.sessionStorage.title = firstUserMessage?.content.slice(0, 40) ?? ''
  }

  selectSession(id: string) {
    this.activeSessionId = id
    storage.set(STORAGE_ACTIVE_SESSION, id)
  }

  newSession() {
    const latest = this.entries[0]
    if (latest && latest.chat.messages.length === 0) {
      this.selectSession(latest.sessionStorage.sessionId)
      return
    }
    const entry = this.createEntry(uuid())
    this.entries.unshift(entry)
    this.activeSessionId = entry.sessionStorage.sessionId
    storage.set(STORAGE_ACTIVE_SESSION, entry.sessionStorage.sessionId)
  }

  deleteSession(id: string) {
    this.entries = this.entries.filter(
      (entry) => entry.sessionStorage.sessionId !== id
    )
    void AiChatSessionStorage.removeSession(id)
    if (this.activeSessionId === id) {
      if (this.entries.length === 0) {
        const entry = this.createEntry(uuid())
        this.entries = [entry]
        this.activeSessionId = entry.sessionStorage.sessionId
      } else {
        this.activeSessionId = this.entries[0].sessionStorage.sessionId
      }
      storage.set(STORAGE_ACTIVE_SESSION, this.activeSessionId)
    }
  }

  clearActiveMessages() {
    const entry = this.activeEntry
    if (!entry) return
    entry.chat.clearMessages()
    entry.sessionStorage.title = ''
  }

  async sendMessage() {
    const chat = this.activeChat
    if (!chat) return
    await chat.sendMessage()
    this.syncActiveTitle()
  }

  abortGeneration() {
    this.activeChat?.abortGeneration()
  }

  async retryLastMessage() {
    const chat = this.activeChat
    if (!chat) return
    await chat.retryLastMessage()
    this.syncActiveTitle()
  }

  deleteMessage(id: string) {
    const chat = this.activeChat
    if (!chat) return
    chat.deleteMessage(id)
    this.syncActiveTitle()
  }
}

export default new Store()
