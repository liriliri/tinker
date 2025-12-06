import { makeAutoObservable } from 'mobx'
import type JSONEditor from 'jsoneditor'

type EditorMode = 'text' | 'tree'

const STORAGE_KEY = 'tinker-json-editor-content'
const MODE_STORAGE_KEY = 'tinker-json-editor-mode'

class Store {
  jsonInput: string = ''
  mode: EditorMode = 'text'
  treeEditorInstance: JSONEditor | null = null
  history: string[] = []
  historyIndex: number = -1
  isUndoRedo: boolean = false

  constructor() {
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  get isEmpty() {
    return !this.jsonInput.trim()
  }

  get canUndo() {
    return this.historyIndex > 0
  }

  get canRedo() {
    return this.historyIndex < this.history.length - 1
  }

  private loadFromStorage() {
    const savedContent = localStorage.getItem(STORAGE_KEY)
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY)

    if (savedContent) {
      this.jsonInput = savedContent
      this.history = [savedContent]
      this.historyIndex = 0
    } else {
      this.history = ['']
      this.historyIndex = 0
    }
    if (savedMode) {
      this.mode = savedMode as EditorMode
    }
  }

  setJsonInput(value: string) {
    this.jsonInput = value
    localStorage.setItem(STORAGE_KEY, value)

    // Add to history if not from undo/redo
    if (!this.isUndoRedo) {
      // Remove any history after current index
      this.history = this.history.slice(0, this.historyIndex + 1)
      // Add new state
      this.history.push(value)
      // Limit history size to 50 entries
      if (this.history.length > 50) {
        this.history.shift()
      } else {
        this.historyIndex++
      }
    }
    this.isUndoRedo = false
  }

  setMode(mode: EditorMode) {
    this.mode = mode
    localStorage.setItem(MODE_STORAGE_KEY, mode)
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

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.jsonInput)
    } catch (err) {
      console.error('Failed to copy:', err)
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

  clearJson() {
    this.setJsonInput('')
  }

  setTreeEditorInstance(instance: JSONEditor | null) {
    this.treeEditorInstance = instance
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
    if (this.canUndo) {
      this.historyIndex--
      this.isUndoRedo = true
      this.jsonInput = this.history[this.historyIndex]
      localStorage.setItem(STORAGE_KEY, this.jsonInput)
    }
  }

  redo() {
    if (this.canRedo) {
      this.historyIndex++
      this.isUndoRedo = true
      this.jsonInput = this.history[this.historyIndex]
      localStorage.setItem(STORAGE_KEY, this.jsonInput)
    }
  }
}

export default new Store()
