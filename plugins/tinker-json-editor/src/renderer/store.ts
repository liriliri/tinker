import { makeAutoObservable } from 'mobx'
import type JSONEditor from 'jsoneditor'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import type { editor } from 'monaco-editor'
import BaseStore from 'share/BaseStore'

type EditorMode = 'text' | 'tree'

const STORAGE_KEY = 'tinker-json-editor-content'
const MODE_STORAGE_KEY = 'tinker-json-editor-mode'
const FILE_PATH_KEY = 'file-path'

const storage = new LocalStore('tinker-json-editor')

class Store extends BaseStore {
  jsonInput: string = ''
  mode: EditorMode = 'text'
  treeEditorInstance: JSONEditor | null = null
  textEditorInstance: editor.IStandaloneCodeEditor | null = null
  undoRedoVersion: number = 0
  currentFilePath: string | null = null
  savedContent: string = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.init()
  }

  private async init() {
    // Load from localStorage first (as fallback)
    this.loadFromStorage()
    // Load saved file if exists
    this.loadSavedFile()
  }

  private loadSavedFile() {
    const savedFilePath = storage.get(FILE_PATH_KEY)

    if (savedFilePath) {
      try {
        const content = jsonEditor.readFile(savedFilePath)
        this.currentFilePath = savedFilePath
        this.savedContent = content
        this.jsonInput = content
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
    return isStrBlank(this.jsonInput)
  }

  get canUndo() {
    // Access undoRedoVersion to make this reactive
    void this.undoRedoVersion
    return this.textEditorInstance?.getModel()?.canUndo() ?? false
  }

  get canRedo() {
    // Access undoRedoVersion to make this reactive
    void this.undoRedoVersion
    return this.textEditorInstance?.getModel()?.canRedo() ?? false
  }

  get lineCount() {
    if (!this.jsonInput) return 0
    return this.jsonInput.split('\n').length
  }

  get jsonError() {
    if (isStrBlank(this.jsonInput)) return null
    try {
      JSON.parse(this.jsonInput)
      return null
    } catch (err) {
      return err instanceof Error ? err.message : 'Invalid JSON'
    }
  }

  get currentFileName() {
    if (!this.currentFilePath) return null
    return jsonEditor.getFileName(this.currentFilePath)
  }

  get hasUnsavedChanges() {
    return this.jsonInput !== this.savedContent
  }

  private loadFromStorage() {
    const savedContent = storage.get(STORAGE_KEY)
    const savedMode = storage.get(MODE_STORAGE_KEY)

    if (savedContent) {
      this.jsonInput = savedContent
    }
    if (savedMode) {
      this.mode = savedMode as EditorMode
    }
  }

  setJsonInput(value: string) {
    this.jsonInput = value
    // Only save to localStorage if there's no file path
    // When editing a file, content is managed by the file system
    if (!this.currentFilePath) {
      storage.set(STORAGE_KEY, value)
    }
  }

  setMode(mode: EditorMode) {
    this.mode = mode
    storage.set(MODE_STORAGE_KEY, mode)
  }

  formatJson() {
    if (this.isEmpty) return

    try {
      const parsed = JSON.parse(this.jsonInput)
      this.setJsonInput(JSON.stringify(parsed, null, 2))
    } catch (err) {
      console.error('Format error:', err)
    }
  }

  minifyJson() {
    if (this.isEmpty) return

    try {
      const parsed = JSON.parse(this.jsonInput)
      this.setJsonInput(JSON.stringify(parsed))
    } catch (err) {
      console.error('Minify error:', err)
    }
  }

  async pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      this.setJsonInput(text)
    } catch (err) {
      console.error('Failed to paste:', err)
    }
  }

  loadFromFile(content: string) {
    this.setJsonInput(content)
  }

  newFile() {
    this.currentFilePath = null
    this.savedContent = ''
    storage.remove(FILE_PATH_KEY)
    // Clear localStorage content when creating new file
    storage.remove(STORAGE_KEY)
    this.clearJson()
  }

  async openFile() {
    try {
      const result = await tinker.showOpenDialog({
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
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
      const content = jsonEditor.readFile(filePath)
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
        jsonEditor.writeFile(this.currentFilePath, this.jsonInput)
        this.savedContent = this.jsonInput
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
        defaultPath: this.currentFileName || 'untitled.json',
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return
      }

      jsonEditor.writeFile(result.filePath, this.jsonInput)
      this.currentFilePath = result.filePath
      this.savedContent = this.jsonInput
      storage.set(FILE_PATH_KEY, result.filePath)
      // Clear localStorage content since we now have a file path
      storage.remove(STORAGE_KEY)
    } catch (err) {
      console.error('Failed to save file as:', err)
    }
  }

  clearJson() {
    this.setJsonInput('')
  }

  setTreeEditorInstance(instance: JSONEditor | null) {
    this.treeEditorInstance = instance
  }

  setTextEditorInstance(instance: editor.IStandaloneCodeEditor | null) {
    this.textEditorInstance = instance
  }

  updateUndoRedoState() {
    this.undoRedoVersion++
  }

  expandAll() {
    if (this.treeEditorInstance) {
      this.treeEditorInstance.expandAll()
    }
  }

  collapseAll() {
    if (this.treeEditorInstance) {
      this.treeEditorInstance.collapseAll()
    }
  }

  undo() {
    if (this.textEditorInstance) {
      this.textEditorInstance.trigger('keyboard', 'undo', null)
    }
  }

  redo() {
    if (this.textEditorInstance) {
      this.textEditorInstance.trigger('keyboard', 'redo', null)
    }
  }
}

export default new Store()
