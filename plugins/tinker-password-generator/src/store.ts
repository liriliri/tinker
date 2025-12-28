import { makeAutoObservable } from 'mobx'
import BaseStore from 'share/BaseStore'
import LocalStore from 'licia/LocalStore'
import Vault from 'vault'

export type CharsetState = 'required' | 'allowed' | 'forbidden'

const storage = new LocalStore('tinker-password-generator')

interface StorageData {
  length: number
  repeat: number
  required: number
  lower: CharsetState
  upper: CharsetState
  number: CharsetState
  symbol: CharsetState
  dash: CharsetState
  space: CharsetState
}

class Store extends BaseStore {
  phrase = ''
  service = ''
  length = 12
  repeat = 0
  required = 2
  showPhrase = false

  lower: CharsetState = 'allowed'
  upper: CharsetState = 'allowed'
  number: CharsetState = 'allowed'
  symbol: CharsetState = 'allowed'
  dash: CharsetState = 'allowed'
  space: CharsetState = 'forbidden'

  generatedPassword = ''

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadSettings()
  }

  private loadSettings() {
    const saved = storage.get('settings') as StorageData | undefined
    if (saved) {
      this.length = saved.length ?? 12
      this.repeat = saved.repeat ?? 0
      this.required = saved.required ?? 2
      this.lower = saved.lower ?? 'allowed'
      this.upper = saved.upper ?? 'allowed'
      this.number = saved.number ?? 'allowed'
      this.symbol = saved.symbol ?? 'allowed'
      this.dash = saved.dash ?? 'allowed'
      this.space = saved.space ?? 'forbidden'
    }
  }

  private saveSettings() {
    const settings: StorageData = {
      length: this.length,
      repeat: this.repeat,
      required: this.required,
      lower: this.lower,
      upper: this.upper,
      number: this.number,
      symbol: this.symbol,
      dash: this.dash,
      space: this.space,
    }
    storage.set('settings', settings)
  }

  setPhrase(value: string) {
    this.phrase = value
  }

  setService(value: string) {
    this.service = value
  }

  setLength(value: number) {
    this.length = value
    this.saveSettings()
  }

  setRepeat(value: number) {
    this.repeat = value
    this.saveSettings()
  }

  setRequired(value: number) {
    this.required = value
    this.saveSettings()
  }

  toggleShowPhrase() {
    this.showPhrase = !this.showPhrase
  }

  setLower(state: CharsetState) {
    this.lower = state
    this.saveSettings()
  }

  setUpper(state: CharsetState) {
    this.upper = state
    this.saveSettings()
  }

  setNumber(state: CharsetState) {
    this.number = state
    this.saveSettings()
  }

  setSymbol(state: CharsetState) {
    this.symbol = state
    this.saveSettings()
  }

  setDash(state: CharsetState) {
    this.dash = state
    this.saveSettings()
  }

  setSpace(state: CharsetState) {
    this.space = state
    this.saveSettings()
  }

  generatePassword() {
    if (!this.phrase || !this.service) {
      this.generatedPassword = ''
      return
    }

    try {
      const settings: Record<string, string | number | undefined> = {
        phrase: this.phrase,
        length: this.length,
        repeat: this.repeat || undefined,
      }

      // Handle character types
      const charTypes = [
        { name: 'lower', state: this.lower },
        { name: 'upper', state: this.upper },
        { name: 'number', state: this.number },
        { name: 'symbol', state: this.symbol },
        { name: 'dash', state: this.dash },
        { name: 'space', state: this.space },
      ]

      charTypes.forEach(({ name, state }) => {
        if (state === 'required') {
          settings[name] = this.required
        } else if (state === 'forbidden') {
          settings[name] = 0
        }
        // 'allowed' state doesn't need to be set explicitly
      })

      const vault = new Vault(settings)
      this.generatedPassword = vault.generate(this.service)
    } catch (error) {
      this.generatedPassword = ''
      throw error
    }
  }
}

const store = new Store()

export default store
