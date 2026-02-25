import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import BaseStore from 'share/BaseStore'
import {
  calculateAllHashes,
  calculateFileHashes,
  type HashAlgorithm,
} from './lib/hash'

type InputType = 'text' | 'file'

const STORAGE_KEY_UPPERCASE = 'uppercase'
const STORAGE_KEY_INPUT_TYPE = 'inputType'
const storage = new LocalStore('tinker-hash')

const EMPTY_HASH_RESULTS: Record<HashAlgorithm, string> = {
  md5: '',
  sha1: '',
  sha256: '',
  sha512: '',
}

class Store extends BaseStore {
  input: string = ''
  textHashResults: Record<HashAlgorithm, string> = { ...EMPTY_HASH_RESULTS }
  fileHashResults: Record<HashAlgorithm, string> = { ...EMPTY_HASH_RESULTS }
  uppercase: boolean = false
  inputType: InputType = 'text'
  fileName: string = ''

  get hashResults() {
    return this.inputType === 'text'
      ? this.textHashResults
      : this.fileHashResults
  }

  constructor() {
    super()
    makeAutoObservable(this)
    this.loadSettings()
  }

  private loadSettings() {
    const savedUppercase = storage.get(STORAGE_KEY_UPPERCASE)
    if (savedUppercase !== null) {
      this.uppercase = savedUppercase === true || savedUppercase === 'true'
    }

    const savedInputType = storage.get(STORAGE_KEY_INPUT_TYPE)
    if (savedInputType === 'text' || savedInputType === 'file') {
      this.inputType = savedInputType
    }
  }

  setInput(value: string) {
    this.input = value
    this.calculateHashes()
  }

  setUppercase(value: boolean) {
    this.uppercase = value
    storage.set(STORAGE_KEY_UPPERCASE, value)
    // Recalculate both text and file hashes with new case setting
    this.calculateHashes()
    this.recalculateFileHashes()
  }

  setInputType(value: InputType) {
    this.inputType = value
    storage.set(STORAGE_KEY_INPUT_TYPE, value)
  }

  clear() {
    this.input = ''
    this.fileName = ''
    this.textHashResults = { ...EMPTY_HASH_RESULTS }
    this.fileHashResults = { ...EMPTY_HASH_RESULTS }
  }

  private applyCase(
    results: Record<HashAlgorithm, string>
  ): Record<HashAlgorithm, string> {
    if (!this.uppercase) return results
    return {
      md5: results.md5.toUpperCase(),
      sha1: results.sha1.toUpperCase(),
      sha256: results.sha256.toUpperCase(),
      sha512: results.sha512.toUpperCase(),
    }
  }

  async handleFileOpen(file: File) {
    try {
      this.fileName = file.name
      const results = await calculateFileHashes(file)
      this.fileHashResults = this.applyCase(results)
    } catch (error) {
      console.error('Failed to calculate file hashes:', error)
    }
  }

  async handleFilePath(filePath: string) {
    try {
      const buffer = await tinker.readFile(filePath)
      const fileName = filePath.split(/[\\/]/).pop() || filePath
      this.fileName = fileName

      const file = new File([buffer], fileName)
      const results = await calculateFileHashes(file)
      this.fileHashResults = this.applyCase(results)
    } catch (error) {
      console.error('Failed to calculate file hashes from path:', error)
      throw error
    }
  }

  calculateHashes() {
    if (!this.input) {
      this.textHashResults = { ...EMPTY_HASH_RESULTS }
      return
    }

    const results = calculateAllHashes(this.input)
    this.textHashResults = this.applyCase(results)
  }

  recalculateFileHashes() {
    if (!this.fileHashResults.md5) {
      return
    }

    const caseMethod = this.uppercase ? 'toUpperCase' : 'toLowerCase'
    this.fileHashResults = {
      md5: this.fileHashResults.md5[caseMethod](),
      sha1: this.fileHashResults.sha1[caseMethod](),
      sha256: this.fileHashResults.sha256[caseMethod](),
      sha512: this.fileHashResults.sha512[caseMethod](),
    }
  }
}

const store = new Store()

export default store
