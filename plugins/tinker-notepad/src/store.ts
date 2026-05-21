import { makeAutoObservable, reaction } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import type { editor } from 'monaco-editor'
import BaseStore from 'share/BaseStore'

const STORAGE_CONTENT = 'content'
const STORAGE_FILE_PATH = 'file-path'
const STORAGE_FONT_SIZE = 'font-size'

const DEFAULT_FONT_SIZE = 14
const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 32

const storage = new LocalStore('tinker-notepad')

class Store extends BaseStore {
  content: string = ''
  editorInstance: editor.IStandaloneCodeEditor | null = null
  undoRedoVersion: number = 0
  fileVersion: number = 0
  currentFilePath: string | null = null
  savedContent: string = ''
  language: string = 'plaintext'
  fontSize: number = DEFAULT_FONT_SIZE
  cursorLine: number = 1
  cursorColumn: number = 1

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
    this.init()
    this.bindEvent()
  }

  private bindEvent() {
    reaction(
      () => this.currentFileName,
      (fileName) => {
        tinker.setTitle(fileName || '')
      }
    )
  }

  private loadStorage() {
    const savedContent = storage.get(STORAGE_CONTENT)
    if (savedContent) {
      this.content = savedContent
    }
    this.fontSize = Number(storage.get(STORAGE_FONT_SIZE)) || DEFAULT_FONT_SIZE
  }

  private async init() {
    await this.loadSavedFile()
  }

  private async loadSavedFile() {
    const savedFilePath = storage.get(STORAGE_FILE_PATH)

    if (savedFilePath) {
      try {
        const content = await tinker.readFile(savedFilePath, 'utf-8')
        this.currentFilePath = savedFilePath
        this.savedContent = content
        this.content = content
        storage.remove(STORAGE_CONTENT)
      } catch {
        storage.remove(STORAGE_FILE_PATH)
      }
    }
  }

  get isEmpty() {
    return isStrBlank(this.content)
  }

  get canUndo() {
    void this.undoRedoVersion
    return this.editorInstance?.getModel()?.canUndo() ?? false
  }

  get canRedo() {
    void this.undoRedoVersion
    return this.editorInstance?.getModel()?.canRedo() ?? false
  }

  get currentFileName() {
    if (!this.currentFilePath) return null
    return splitPath(this.currentFilePath).name
  }

  get hasUnsavedChanges() {
    return this.content !== this.savedContent
  }

  setContent(value: string) {
    this.content = value
    if (!this.currentFilePath) {
      storage.set(STORAGE_CONTENT, value)
    }
  }

  setLanguage(lang: string) {
    this.language = lang
  }

  setCursor(line: number, column: number) {
    this.cursorLine = line
    this.cursorColumn = column
  }

  increaseFontSize() {
    if (this.fontSize < MAX_FONT_SIZE) {
      this.fontSize = this.fontSize + 1
      storage.set(STORAGE_FONT_SIZE, this.fontSize)
    }
  }

  decreaseFontSize() {
    if (this.fontSize > MIN_FONT_SIZE) {
      this.fontSize = this.fontSize - 1
      storage.set(STORAGE_FONT_SIZE, this.fontSize)
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
      this.setContent(text)
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
    this.setContent(content)
    this.fileVersion++
  }

  newFile() {
    this.currentFilePath = null
    this.savedContent = ''
    storage.remove(STORAGE_FILE_PATH)
    storage.remove(STORAGE_CONTENT)
    this.setContent('')
    this.fileVersion++
  }

  async openFile() {
    try {
      const result = await tinker.showOpenDialog({
        filters: [
          { name: 'Text Files', extensions: ['txt', 'log', 'csv'] },
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
      this.loadFromFile(content, filePath)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }

  async saveFile() {
    try {
      if (this.currentFilePath) {
        await tinker.writeFile(this.currentFilePath, this.content, 'utf-8')
        this.savedContent = this.content
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
        defaultPath: this.currentFileName || 'untitled.txt',
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] },
        ],
      })

      if (result.canceled || !result.filePath) {
        return
      }

      await tinker.writeFile(result.filePath, this.content, 'utf-8')
      this.currentFilePath = result.filePath
      this.savedContent = this.content
      storage.set(STORAGE_FILE_PATH, result.filePath)
      storage.remove(STORAGE_CONTENT)
    } catch (err) {
      console.error('Failed to save file as:', err)
    }
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

  openSearch() {
    if (this.editorInstance) {
      this.editorInstance.trigger('keyboard', 'actions.find', null)
    }
  }
}

export default new Store()
