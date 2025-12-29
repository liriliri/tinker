import { makeAutoObservable } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import type { editor } from 'monaco-editor'
import BaseStore from 'share/BaseStore'

const STORAGE_KEY = 'content'
const FILE_PATH_KEY = 'file-path'
const VIEW_MODE_KEY = 'view-mode'

const storage = new LocalStore('tinker-markdown-editor')

export type ViewMode = 'split' | 'editor' | 'preview'

class Store extends BaseStore {
  markdownInput: string = ''
  editorInstance: editor.IStandaloneCodeEditor | null = null
  undoRedoVersion: number = 0
  scrollPercent: number = 0
  currentFilePath: string | null = null
  savedContent: string = ''
  viewMode: ViewMode = 'split'

  constructor() {
    super()
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    // Load from localStorage first (as fallback)
    this.loadFromLocalStorage()
    // Load saved file if exists
    await this.loadSavedFile()
    this.loadViewMode()
  }

  private loadViewMode() {
    const savedMode = storage.get(VIEW_MODE_KEY)
    if (
      savedMode === 'split' ||
      savedMode === 'editor' ||
      savedMode === 'preview'
    ) {
      this.viewMode = savedMode
    }
  }

  private async loadSavedFile() {
    const savedFilePath = storage.get(FILE_PATH_KEY)

    if (savedFilePath) {
      try {
        const content = await markdownEditor.readFile(savedFilePath)
        this.currentFilePath = savedFilePath
        this.savedContent = content
        this.markdownInput = content
        // Clear localStorage content since we're loading from a file
        storage.remove(STORAGE_KEY)
      } catch {
        // File no longer exists or can't be read, clear the saved path
        storage.remove(FILE_PATH_KEY)
        console.log('Failed to load saved file')
      }
    }
  }

  get isEmpty() {
    return isStrBlank(this.markdownInput)
  }

  get canUndo() {
    // Access undoRedoVersion to make this reactive
    void this.undoRedoVersion
    return this.editorInstance?.getModel()?.canUndo() ?? false
  }

  get canRedo() {
    // Access undoRedoVersion to make this reactive
    void this.undoRedoVersion
    return this.editorInstance?.getModel()?.canRedo() ?? false
  }

  get lineCount() {
    if (!this.markdownInput) return 0
    return this.markdownInput.split('\n').length
  }

  get currentFileName() {
    if (!this.currentFilePath) return null
    return splitPath(this.currentFilePath).name
  }

  get hasUnsavedChanges() {
    return this.markdownInput !== this.savedContent
  }

  private loadFromLocalStorage() {
    const savedContent = storage.get(STORAGE_KEY)

    if (savedContent) {
      this.markdownInput = savedContent
    }
  }

  setMarkdownInput(value: string) {
    this.markdownInput = value
    // Only save to localStorage if there's no file path
    // When editing a file, content is managed by the file system
    if (!this.currentFilePath) {
      storage.set(STORAGE_KEY, value)
    }
  }

  setEditorInstance(editor: editor.IStandaloneCodeEditor | null) {
    this.editorInstance = editor
  }

  updateUndoRedoState() {
    this.undoRedoVersion++
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      this.setMarkdownInput(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  loadFromFile(content: string, filePath?: string) {
    if (filePath) {
      this.currentFilePath = filePath
      this.savedContent = content
      storage.set(FILE_PATH_KEY, filePath)
      // Clear localStorage content since we're now editing a file
      storage.remove(STORAGE_KEY)
    }
    this.setMarkdownInput(content)
  }

  newFile() {
    this.currentFilePath = null
    this.savedContent = ''
    storage.remove(FILE_PATH_KEY)
    // Clear localStorage content when creating new file
    storage.remove(STORAGE_KEY)
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
      const content = await markdownEditor.readFile(filePath)
      this.currentFilePath = filePath
      this.savedContent = content
      storage.set(FILE_PATH_KEY, filePath)
      // Clear localStorage content since we're now editing a file
      storage.remove(STORAGE_KEY)
      this.loadFromFile(content)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  async saveFile() {
    try {
      if (this.currentFilePath) {
        // Save to existing file
        await markdownEditor.writeFile(this.currentFilePath, this.markdownInput)
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

      await markdownEditor.writeFile(result.filePath, this.markdownInput)
      this.currentFilePath = result.filePath
      this.savedContent = this.markdownInput
      storage.set(FILE_PATH_KEY, result.filePath)
      // Clear localStorage content since we now have a file path
      storage.remove(STORAGE_KEY)
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
    storage.set(VIEW_MODE_KEY, mode)
  }
}

export default new Store()
