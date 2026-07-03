import { makeAutoObservable, reaction } from 'mobx'
import type JSONEditor from 'jsoneditor'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import type { editor } from 'monaco-editor'
import toast from 'react-hot-toast'
import i18n from 'i18next'
import BaseStore from 'share/BaseStore'

type EditorMode = 'text' | 'tree'

const STORAGE_CONTENT = 'tinker-json-editor-content'
const STORAGE_MODE = 'tinker-json-editor-mode'
const STORAGE_FILE_PATH = 'file-path'

const storage = new LocalStore('tinker-json-editor')

class Store extends BaseStore {
  jsonInput: string = ''
  mode: EditorMode = 'text'
  treeEditorInstance: JSONEditor | null = null
  textEditorInstance: editor.IStandaloneCodeEditor | null = null
  undoRedoVersion: number = 0
  fileVersion: number = 0
  currentFilePath: string | null = null
  savedContent: string = ''
  hasAI: boolean = false
  isFixingWithAI: boolean = false

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    this.bindEvent()
    this.loadSavedFile()
    tinker.getAIProviders().then((providers) => {
      this.hasAI = providers.length > 0
    })
  }

  private bindEvent() {
    reaction(
      () => this.currentFileName,
      (fileName) => {
        tinker.setTitle(fileName || '')
      }
    )
  }

  private async loadSavedFile() {
    const savedFilePath = storage.get<string | undefined>(STORAGE_FILE_PATH)

    if (savedFilePath) {
      try {
        const content = await tinker.readFile(savedFilePath, 'utf-8')
        this.currentFilePath = savedFilePath
        this.savedContent = content
        this.jsonInput = content
        storage.remove(STORAGE_CONTENT)
      } catch {
        // File no longer exists or can't be read, clear the saved path
        storage.remove(STORAGE_FILE_PATH)
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
    return splitPath(this.currentFilePath).name
  }

  get hasUnsavedChanges() {
    return this.jsonInput !== this.savedContent
  }

  private loadStorage() {
    const savedContent = storage.get<string | undefined>(STORAGE_CONTENT)
    const savedMode = storage.get<EditorMode | undefined>(STORAGE_MODE)

    if (savedContent) {
      this.jsonInput = savedContent
    }
    if (savedMode) {
      this.mode = savedMode
    }
  }

  setJsonInput(value: string) {
    this.jsonInput = value
    if (!this.currentFilePath) {
      storage.set(STORAGE_CONTENT, value)
    }
  }

  setMode(mode: EditorMode) {
    this.mode = mode
    storage.set(STORAGE_MODE, mode)
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

  loadFromFile(content: string, filePath?: string) {
    if (filePath) {
      this.currentFilePath = filePath
      this.savedContent = content
      storage.set(STORAGE_FILE_PATH, filePath)
      storage.remove(STORAGE_CONTENT)
    }
    this.setJsonInput(content)
    this.fileVersion++
  }

  newFile() {
    this.currentFilePath = null
    this.savedContent = ''
    storage.remove(STORAGE_FILE_PATH)
    storage.remove(STORAGE_CONTENT)
    this.clearJson()
    this.fileVersion++
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
      const content = await tinker.readFile(filePath, 'utf-8')
      this.currentFilePath = filePath
      this.savedContent = content
      storage.set(STORAGE_FILE_PATH, filePath)
      storage.remove(STORAGE_CONTENT)
      this.loadFromFile(content)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  async saveFile() {
    try {
      if (this.currentFilePath) {
        await tinker.writeFile(this.currentFilePath, this.jsonInput, 'utf-8')
        this.savedContent = this.jsonInput
      } else {
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

      await tinker.writeFile(result.filePath, this.jsonInput, 'utf-8')
      this.currentFilePath = result.filePath
      this.savedContent = this.jsonInput
      storage.set(STORAGE_FILE_PATH, result.filePath)
      storage.remove(STORAGE_CONTENT)
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

  async fixJsonWithAI() {
    if (this.isEmpty || this.isFixingWithAI) return

    this.isFixingWithAI = true
    const loadingToast = toast.loading(i18n.t('fixingJson'))

    try {
      const systemPrompt =
        'You are a JSON repair tool. Fix the following invalid JSON and return ONLY the corrected JSON without any explanation, markdown formatting, or extra content. Do not wrap it in code blocks.'

      const result = await tinker.callAI({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: this.jsonInput },
        ],
      })

      if (!result.success || !result.data?.content) {
        toast.error(i18n.t('fixJsonFailed'), { id: loadingToast })
        return
      }

      const content = (result.data.content as string).trim()
      JSON.parse(content)
      this.setJsonInput(content)
      toast.success(i18n.t('fixJsonSuccess'), { id: loadingToast })
    } catch {
      toast.error(i18n.t('fixJsonFailed'), { id: loadingToast })
    } finally {
      this.isFixingWithAI = false
    }
  }
}

export default new Store()
