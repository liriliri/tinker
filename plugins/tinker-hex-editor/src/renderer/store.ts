import { makeAutoObservable } from 'mobx'
import splitPath from 'licia/splitPath'
import BaseStore from 'share/BaseStore'

class Store extends BaseStore {
  // Hex editor data
  data: number[] = []
  nonce: number = 0
  currentFilePath: string | null = null
  savedData: number[] = []

  constructor() {
    super()
    makeAutoObservable(this)
  }

  get hasData() {
    return this.data.length > 0
  }

  get currentFileName() {
    if (!this.currentFilePath) return null
    return splitPath(this.currentFilePath).name
  }

  get hasUnsavedChanges() {
    if (this.data.length !== this.savedData.length) return true
    return !this.data.every((val, idx) => val === this.savedData[idx])
  }

  setValue(offset: number, value: number) {
    this.data[offset] = value
    this.nonce += 1
  }

  clearData() {
    this.data = []
    this.nonce += 1
  }

  async openFile() {
    try {
      const result = await tinker.showOpenDialog({
        properties: ['openFile'],
      })

      if (result && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const buffer = await hexEditor.readFile(filePath)
        const data = Array.from(buffer)
        this.currentFilePath = filePath
        this.data = data
        this.savedData = [...data]
        this.nonce += 1
      }
    } catch (error) {
      console.error('Open file failed:', error)
    }
  }

  async saveFile() {
    try {
      if (this.currentFilePath) {
        // Save to existing file
        const data = new Uint8Array(this.data)
        await hexEditor.writeFile(this.currentFilePath, data)
        this.savedData = [...this.data]
      } else {
        // Show save dialog
        await this.saveFileAs()
      }
    } catch (error) {
      console.error('Save file failed:', error)
    }
  }

  async saveFileAs() {
    try {
      const result = await tinker.showSaveDialog({
        defaultPath: this.currentFileName || 'untitled.bin',
      })

      if (result && result.filePath) {
        const data = new Uint8Array(this.data)
        await hexEditor.writeFile(result.filePath, data)
        this.currentFilePath = result.filePath
        this.savedData = [...this.data]
      }
    } catch (error) {
      console.error('Save file as failed:', error)
    }
  }

  importData(newData: number[] | Uint8Array, filePath?: string) {
    this.data = Array.from(newData)
    this.savedData = [...this.data]
    this.nonce += 1
    if (filePath) {
      this.currentFilePath = filePath
    }
  }
}

const store = new Store()

export default store
