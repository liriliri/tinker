import { makeAutoObservable } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import type { editor } from 'monaco-editor'

const STORAGE_KEY = 'tinker-markdown-editor-content'
const FILE_PATH_KEY = 'tinker-markdown-editor-file-path'
const VIEW_MODE_KEY = 'tinker-markdown-editor-view-mode'

export type ViewMode = 'split' | 'editor' | 'preview'

class Store {
  markdownInput: string = ''
  editorInstance: editor.IStandaloneCodeEditor | null = null
  undoRedoVersion: number = 0
  isDark: boolean = false
  scrollPercent: number = 0
  currentFilePath: string | null = null
  savedContent: string = ''
  viewMode: ViewMode = 'split'

  constructor() {
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    // Wait for preload to be ready before loading from file
    tinker.on('preloadReady', () => {
      this.loadSavedFile()
    })

    // Load from localStorage first (as fallback)
    this.loadFromLocalStorage()
    this.loadViewMode()
    await this.initTheme()
  }

  private loadViewMode() {
    const savedMode = localStorage.getItem(VIEW_MODE_KEY)
    if (
      savedMode === 'split' ||
      savedMode === 'editor' ||
      savedMode === 'preview'
    ) {
      this.viewMode = savedMode
    }
  }

  private loadSavedFile() {
    const savedFilePath = localStorage.getItem(FILE_PATH_KEY)

    if (savedFilePath) {
      try {
        const content = markdownEditor.readFile(savedFilePath)
        this.currentFilePath = savedFilePath
        this.savedContent = content
        this.markdownInput = content
      } catch (err) {
        // File no longer exists or can't be read, clear the saved path
        localStorage.removeItem(FILE_PATH_KEY)
        console.log('Failed to load saved file')
      }
    }
  }

  get isEmpty() {
    return isStrBlank(this.markdownInput)
  }

  get canUndo() {
    // Access undoRedoVersion to make this reactive
    this.undoRedoVersion
    return this.editorInstance?.getModel()?.canUndo() ?? false
  }

  get canRedo() {
    // Access undoRedoVersion to make this reactive
    this.undoRedoVersion
    return this.editorInstance?.getModel()?.canRedo() ?? false
  }

  get lineCount() {
    if (!this.markdownInput) return 0
    return this.markdownInput.split('\n').length
  }

  get currentFileName() {
    if (!this.currentFilePath) return null
    return markdownEditor.getFileName(this.currentFilePath)
  }

  get hasUnsavedChanges() {
    return this.markdownInput !== this.savedContent
  }

  setIsDark(isDark: boolean) {
    this.isDark = isDark
  }

  private async initTheme() {
    try {
      const theme = await tinker.getTheme()
      this.isDark = theme === 'dark'

      // Listen for theme changes
      tinker.on('changeTheme', async () => {
        const newTheme = await tinker.getTheme()
        this.setIsDark(newTheme === 'dark')
      })
    } catch (err) {
      console.error('Failed to initialize theme:', err)
    }
  }

  private loadFromLocalStorage() {
    const savedContent = localStorage.getItem(STORAGE_KEY)

    if (savedContent) {
      this.markdownInput = savedContent
    }
  }

  setMarkdownInput(value: string) {
    this.markdownInput = value
    localStorage.setItem(STORAGE_KEY, value)
  }

  setEditorInstance(editor: editor.IStandaloneCodeEditor | null) {
    this.editorInstance = editor
  }

  updateUndoRedoState() {
    this.undoRedoVersion++
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.markdownInput)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      this.setMarkdownInput(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  loadFromFile(content: string) {
    this.setMarkdownInput(content)
  }

  newFile() {
    this.currentFilePath = null
    this.savedContent = ''
    localStorage.removeItem(FILE_PATH_KEY)
    this.clearMarkdown()
  }

  async openFile() {
    try {
      const result = await tinker.showOpenDialog({
        filters: [
          { name: 'Markdown Files', extensions: ['md', 'markdown'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      })

      if (
        result.canceled ||
        !result.filePaths ||
        result.filePaths.length === 0
      ) {
        return
      }

      const filePath = result.filePaths[0]
      const content = markdownEditor.readFile(filePath)
      this.currentFilePath = filePath
      this.savedContent = content
      localStorage.setItem(FILE_PATH_KEY, filePath)
      this.loadFromFile(content)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  async saveFile() {
    try {
      if (this.currentFilePath) {
        // Save to existing file
        markdownEditor.writeFile(this.currentFilePath, this.markdownInput)
        this.savedContent = this.markdownInput
      } else {
        // Show save dialog
        await this.saveFileAs()
      }
    } catch (err) {
      console.error('Failed to save file:', err)
    }
  }

  async saveFileAs() {
    try {
      const result = await tinker.showSaveDialog({
        defaultPath: this.currentFileName || 'untitled.md',
        filters: [
          { name: 'Markdown Files', extensions: ['md'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return
      }

      markdownEditor.writeFile(result.filePath, this.markdownInput)
      this.currentFilePath = result.filePath
      this.savedContent = this.markdownInput
      localStorage.setItem(FILE_PATH_KEY, result.filePath)
    } catch (err) {
      console.error('Failed to save file as:', err)
    }
  }

  clearMarkdown() {
    this.setMarkdownInput('')
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

  setScrollPercent(percent: number) {
    this.scrollPercent = percent
  }

  setViewMode(mode: ViewMode) {
    this.viewMode = mode
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }
}

export default new Store()
