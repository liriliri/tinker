import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'

const storage = new LocalStore('tinker-hex-editor')

class Store extends BaseStore {
  // Hex editor data
  data: number[] = []
  nonce: number = 0

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadData()
  }

  get hasData() {
    return this.data.length > 0
  }

  private loadData() {
    const saved = storage.get('hex-data')
    if (saved && Array.isArray(saved)) {
      this.data = saved
    }
  }

  setValue(offset: number, value: number) {
    this.data[offset] = value
    this.nonce += 1
    this.saveData()
  }

  private saveData() {
    storage.set('hex-data', this.data)
  }

  clearData() {
    this.data = []
    this.nonce += 1
    this.saveData()
  }

  async openFileDialog() {
    try {
      const result = await tinker.showOpenDialog({
        properties: ['openFile'],
      })

      if (result && result.filePaths && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const buffer = await hexEditor.readFile(filePath)
        this.importData(Array.from(buffer))
      }
    } catch (error) {
      console.error('Open file failed:', error)
    }
  }

  importData(newData: number[] | Uint8Array) {
    this.data = Array.from(newData)
    this.nonce += 1
    this.saveData()
  }
}

const store = new Store()

export default store
