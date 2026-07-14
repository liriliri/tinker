import { makeAutoObservable } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import type { editor } from 'monaco-editor'
import {
  initAiChatAvailability,
  toggleAiChatOpen,
} from 'share/lib/aiChat/aiAvailability'
import { LocalStoreChatPrefs } from 'share/lib/aiChat/chatPrefsStorage'
import { ChatSession } from 'share/lib/aiChat/chatSession'
import { IndexedDbChatStorage } from 'share/lib/aiChat/chatStorage'
import AiChatStore from 'share/store/AiChat'
import BaseStore from 'share/store/Base'
import { createMcpApi } from './mcp'
import { DEFAULT_DIAGRAM } from './lib/mermaid'

const STORAGE_CONTENT = 'content'
const STORAGE_VIEW_MODE = 'view-mode'
const STORAGE_DARK_MODE = 'darkMode'

const storage = new LocalStore('tinker-code-diagram')
const sessionStorage = new IndexedDbChatStorage('tinker-code-diagram')

type ViewMode = 'split' | 'editor' | 'preview'

export class Store extends BaseStore {
  chat: AiChatStore
  readonly mcp = createMcpApi(() => this)

  codeInput: string = DEFAULT_DIAGRAM
  editorInstance: editor.IStandaloneCodeEditor | null = null
  undoRedoVersion: number = 0
  viewMode: ViewMode = 'split'
  darkMode: boolean = false
  loading: boolean = false
  renderError: string | null = null
  hasRenderedDiagram: boolean = false
  hasAI: boolean = false
  chatOpen: boolean = false

  constructor() {
    super()
    const chatSession = new ChatSession({
      sessionId: sessionStorage.sessionId,
      tools: this.mcp.createAgentTools(),
    })
    this.chat = new AiChatStore({
      chatSession,
      sessionStorage,
      prefsStorage: new LocalStoreChatPrefs(storage),
      initialSystemPrompt:
        'You are a Mermaid diagram assistant. Help the user write, fix, and improve Mermaid diagram source. You have tools to read and update the editor content, and to export the live preview as SVG or PNG. Use tools only when you need the current source or must apply changes or export. After reading or updating, reply with a clear explanation. Do not call tools again unless the user asks for another change or check.',
    })
    makeAutoObservable(this, { chat: false })
    this.loadStorage()
    void initAiChatAvailability(storage).then(({ hasAI, chatOpen }) => {
      this.hasAI = hasAI
      this.chatOpen = chatOpen
    })
  }

  private loadStorage() {
    const savedContent = storage.get(STORAGE_CONTENT)
    if (savedContent) {
      this.codeInput = savedContent
    }
    const savedDarkMode = storage.get(STORAGE_DARK_MODE)
    if (savedDarkMode !== undefined) {
      this.darkMode = savedDarkMode
    }
    this.loadViewMode()
  }

  private loadViewMode() {
    const savedMode = storage.get(STORAGE_VIEW_MODE)
    if (
      savedMode === 'split' ||
      savedMode === 'editor' ||
      savedMode === 'preview'
    ) {
      this.viewMode = savedMode
    }
  }

  get isEmpty() {
    return isStrBlank(this.codeInput)
  }

  get canUndo() {
    void this.undoRedoVersion
    return this.editorInstance?.getModel()?.canUndo() ?? false
  }

  get canRedo() {
    void this.undoRedoVersion
    return this.editorInstance?.getModel()?.canRedo() ?? false
  }

  get lineCount() {
    if (!this.codeInput) return 0
    return this.codeInput.split('\n').length
  }

  setCodeInput(value: string) {
    this.codeInput = value
    storage.set(STORAGE_CONTENT, value)
  }

  setEditorInstance(editor: editor.IStandaloneCodeEditor | null) {
    this.editorInstance = editor
  }

  updateUndoRedoState() {
    this.undoRedoVersion++
  }

  setRenderError(error: string | null) {
    this.renderError = error
  }

  setLoading(loading: boolean) {
    this.loading = loading
  }

  setHasRenderedDiagram(hasRendered: boolean) {
    this.hasRenderedDiagram = hasRendered
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      this.setCodeInput(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  clearCode() {
    this.setCodeInput('')
  }

  undo() {
    if (this.editorInstance) {
      this.editorInstance.trigger('keyboard', 'undo', null)
    }
  }

  redo() {
    if (this.editorInstance) {
      this.editorInstance.trigger('keyboard', 'redo', null)
    }
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    storage.set(STORAGE_VIEW_MODE, mode)
  }

  setDarkMode(darkMode: boolean) {
    this.darkMode = darkMode
    storage.set(STORAGE_DARK_MODE, this.darkMode)
  }

  toggleChat() {
    if (!this.hasAI) return
    this.chatOpen = toggleAiChatOpen(storage, this.chatOpen)
  }
}

export default new Store()
