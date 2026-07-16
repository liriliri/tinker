import { makeAutoObservable } from 'mobx'
import LocalStore from 'licia/LocalStore'
import clone from 'licia/clone'
import contain from 'licia/contain'
import lowerCase from 'licia/lowerCase'
import mapObj from 'licia/mapObj'
import splitPath from 'licia/splitPath'
import toBool from 'licia/toBool'
import upperCase from 'licia/upperCase'
import BaseStore from 'share/store/Base'
import {
  calculateAllHashes,
  calculateFileHashes,
  type HashAlgorithm,
} from './lib/hash'
import { createMcpApi } from './mcp'

type InputType = 'text' | 'file'

const STORAGE_UPPERCASE = 'uppercase'
const STORAGE_INPUT_TYPE = 'inputType'
const storage = new LocalStore('tinker-hash')

const EMPTY_HASH_RESULTS: Record<HashAlgorithm, string> = {
  md5: '',
  sha1: '',
  sha256: '',
  sha512: '',
}

export class Store extends BaseStore {
  readonly mcp = createMcpApi(() => this)

  input: string = ''
  textHashResults: Record<HashAlgorithm, string> = clone(EMPTY_HASH_RESULTS)
  fileHashResults: Record<HashAlgorithm, string> = clone(EMPTY_HASH_RESULTS)
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
    this.loadStorage()
  }

  private loadStorage() {
    const savedUppercase = storage.get(STORAGE_UPPERCASE)
    if (savedUppercase !== null) {
      this.uppercase = toBool(savedUppercase)
    }

    const savedInputType = storage.get(STORAGE_INPUT_TYPE)
    if (contain(['text', 'file'], savedInputType)) {
      this.inputType = savedInputType
    }
  }

  setInput(value: string) {
    this.input = value
    this.calculateHashes()
  }

  setUppercase(value: boolean) {
    this.uppercase = value
    storage.set(STORAGE_UPPERCASE, value)
    this.calculateHashes()
    this.recalculateFileHashes()
  }

  setInputType(value: InputType) {
    this.inputType = value
    storage.set(STORAGE_INPUT_TYPE, value)
  }

  clear() {
    this.input = ''
    this.fileName = ''
    this.textHashResults = clone(EMPTY_HASH_RESULTS)
    this.fileHashResults = clone(EMPTY_HASH_RESULTS)
  }

  private applyCase(
    results: Record<HashAlgorithm, string>
  ): Record<HashAlgorithm, string> {
    if (!this.uppercase) return results
    return mapObj(results, upperCase) as Record<HashAlgorithm, string>
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
      const fileName = splitPath(filePath).name
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
      this.textHashResults = clone(EMPTY_HASH_RESULTS)
      return
    }

    const results = calculateAllHashes(this.input)
    this.textHashResults = this.applyCase(results)
  }

  recalculateFileHashes() {
    if (!this.fileHashResults.md5) {
      return
    }

    this.fileHashResults = mapObj(
      this.fileHashResults,
      this.uppercase ? upperCase : lowerCase
    ) as Record<HashAlgorithm, string>
  }
}

export default new Store()
