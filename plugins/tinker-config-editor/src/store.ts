import { makeAutoObservable, reaction, runInAction } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import LocalStore from 'licia/LocalStore'
import splitPath from 'licia/splitPath'
import type { editor } from 'monaco-editor'
import BaseStore from 'share/BaseStore'
import { getConfigFiles } from './lib/configFiles'
import type { ConfigFile } from './types'

const STORAGE_KEY = 'file-path'
const FONT_SIZE_KEY = 'font-size'
const SIDEBAR_OPEN_KEY = 'sidebarOpen'

const DEFAULT_FONT_SIZE = 14
const MIN_FONT_SIZE = 10
const MAX_FONT_SIZE = 32

const storage = new LocalStore('tinker-config-editor')

class Store extends BaseStore {
  content: string = ''
  editorInstance: editor.IStandaloneCodeEditor | null = null
  undoRedoVersion: number = 0
  fileVersion: number = 0
  currentFilePath: string | null = null
  savedContent: string = ''
  fontSize: number = DEFAULT_FONT_SIZE
  cursorLine: number = 1
  cursorColumn: number = 1
  sidebarOpen: boolean = true
  configFiles: ConfigFile[] = []

  constructor() {
    super()
    makeAutoObservable(this)
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

  private async init() {
    this.sidebarOpen = (storage.get(SIDEBAR_OPEN_KEY) as boolean) ?? true
    this.fontSize = Number(storage.get(FONT_SIZE_KEY)) || DEFAULT_FONT_SIZE
    await this.loadConfigFiles()
    await this.loadSavedFile()
  }

  private async loadConfigFiles() {
    const files = await getConfigFiles()
    runInAction(() => {
      this.configFiles = files
    })
  }

  private async loadSavedFile() {
    const savedFilePath = storage.get(STORAGE_KEY)

    if (savedFilePath) {
      try {
        const content = await tinker.readFile(savedFilePath as string, 'utf-8')
        runInAction(() => {
          this.currentFilePath = savedFilePath as string
          this.savedContent = content
          this.content = content
          this.fileVersion++
        })
        return
      } catch {
        storage.remove(STORAGE_KEY)
      }
    }

    if (this.configFiles.length > 0) {
      await this.openConfigFile(this.configFiles[0].path)
    }
  }

  get isEmpty() {
    return isStrBlank(this.content)
  }

  get language() {
    return (
      this.configFiles.find((f) => f.path === this.currentFilePath)?.language ??
      'plaintext'
    )
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
  }

  setCursor(line: number, column: number) {
    this.cursorLine = line
    this.cursorColumn = column
  }

  increaseFontSize() {
    if (this.fontSize < MAX_FONT_SIZE) {
      this.fontSize = this.fontSize + 1
      storage.set(FONT_SIZE_KEY, this.fontSize)
    }
  }

  decreaseFontSize() {
    if (this.fontSize > MIN_FONT_SIZE) {
      this.fontSize = this.fontSize - 1
      storage.set(FONT_SIZE_KEY, this.fontSize)
    }
  }

  setEditorInstance(editor: editor.IStandaloneCodeEditor | null) {
    this.editorInstance = editor
  }

  updateUndoRedoState() {
    this.undoRedoVersion++
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen
    storage.set(SIDEBAR_OPEN_KEY, this.sidebarOpen)
  }

  loadFromFile(content: string, filePath: string) {
    this.currentFilePath = filePath
    this.savedContent = content
    storage.set(STORAGE_KEY, filePath)
    this.setContent(content)
    this.fileVersion++
  }

  async openConfigFile(filePath: string) {
    try {
      const content = await tinker.readFile(filePath, 'utf-8')
      this.loadFromFile(content, filePath)
    } catch (err) {
      console.error('Failed to open config file:', err)
    }
  }

  async saveFile() {
    try {
      if (this.currentFilePath) {
        await tinker.writeFile(this.currentFilePath, this.content, 'utf-8')
        this.savedContent = this.content
      }
    } catch (err) {
      console.error('Failed to save file:', err)
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
