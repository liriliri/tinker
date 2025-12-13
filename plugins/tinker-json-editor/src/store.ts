import { makeAutoObservable } from 'mobx'
import type JSONEditor from 'jsoneditor'
import isStrBlank from 'licia/isStrBlank'
import openFile from 'licia/openFile'
import type { editor } from 'monaco-editor'
import BaseStore from 'share/BaseStore'

type EditorMode = 'text' | 'tree'

const STORAGE_KEY = 'tinker-json-editor-content'
const MODE_STORAGE_KEY = 'tinker-json-editor-mode'

class Store extends BaseStore {
  jsonInput: string = ''
  mode: EditorMode = 'text'
  treeEditorInstance: JSONEditor | null = null
  textEditorInstance: editor.IStandaloneCodeEditor | null = null
  undoRedoVersion: number = 0

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadFromStorage()
  }

  get isEmpty() {
    return isStrBlank(this.jsonInput)
  }

  get canUndo() {
    // Access undoRedoVersion to make this reactive
    this.undoRedoVersion
    return this.textEditorInstance?.getModel()?.canUndo() ?? false
  }

  get canRedo() {
    // Access undoRedoVersion to make this reactive
    this.undoRedoVersion
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

  private loadFromStorage() {
    const savedContent = localStorage.getItem(STORAGE_KEY)
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY)

    if (savedContent) {
      this.jsonInput = savedContent
    }
    if (savedMode) {
      this.mode = savedMode as EditorMode
    }
  }

  setJsonInput(value: string) {
    this.jsonInput = value
    localStorage.setItem(STORAGE_KEY, value)
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

  loadFromFile(content: string) {
    this.setJsonInput(content)
  }

  async openFile() {
    try {
      const files = await openFile({ accept: '.json,application/json' })
      if (files && files.length > 0) {
        const text = await files[0].text()
        this.loadFromFile(text)
      }
    } catch (err) {
      console.error('Failed to open file:', err)
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
