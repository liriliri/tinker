import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import { Languages } from './lib/formatter/types'

const storage = new LocalStore('tinker-code-formatter')

const STORAGE_STATE = 'code-formatter-state'

type StoredState = {
  input: string
  language: Languages
  tabWidth: number
}

class Store extends BaseStore {
  input: string = ''
  language: Languages = 'javascript'
  tabWidth: number = 4

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadStorage()
  }

  private loadStorage() {
    const saved = storage.get<StoredState | null>(STORAGE_STATE)
    if (saved) {
      this.input = saved.input || ''
      this.language = saved.language || 'javascript'
      this.tabWidth = saved.tabWidth || 4
    }
  }

  private saveState() {
    storage.set(STORAGE_STATE, {
      input: this.input,
      language: this.language,
      tabWidth: this.tabWidth,
    })
  }

  setInput = (value: string) => {
    this.input = value
    this.saveState()
  }

  setLanguage = (value: Languages) => {
    this.language = value
    this.saveState()
  }

  setTabWidth = (value: number) => {
    this.tabWidth = value
    this.saveState()
  }
}

const store = new Store()

export default store
