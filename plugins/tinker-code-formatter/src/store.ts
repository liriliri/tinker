import { makeAutoObservable } from 'mobx'
import isStrBlank from 'licia/isStrBlank'
import isUndef from 'licia/isUndef'
import BaseStore, { storage } from 'share/store/Base'
import { Languages } from './lib/formatter/types'
import formatter from './lib/formatter'
import { createMcpApi } from './mcp'

const STORAGE_STATE = 'code-formatter-state'

type StoredState = {
  input: string
  language: Languages
  tabWidth: number
}

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)
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

  async formatCode(code?: string) {
    if (!isUndef(code)) {
      this.setInput(code)
    }

    if (isStrBlank(this.input)) {
      throw new Error('Input is empty.')
    }

    const handle = await formatter.load(this.language)
    const result = await handle.set(this.input, { tab: this.tabWidth }).format()

    this.setInput(result)
    return result
  }
}

export default new Store()
